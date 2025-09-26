
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import PlayerCard from './PlayerCard';
import { MdOutlineCancel } from "react-icons/md";

export default function PlayerRoster({ 
  clanMembers,
  assignedPlayerIds,
  searchQuery, 
  setSearchQuery,
  filterLevel,
  setFilterLevel,
  selectedPlayer,
  onPlayerClick,
  onRosterClick // Added onRosterClick to props
}) {
  const availableMembers = clanMembers
    .filter(member => !assignedPlayerIds.includes(member.id))
    .filter(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterLevel === 'all' || member.resonance >= filterLevel)
    );
    
  // Determine if the roster area should be clickable (e.g., when a player outside the roster is selected)
  const isRosterClickable = selectedPlayer && !availableMembers.find(p => p.id === selectedPlayer.id);

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
      <CardHeader className="pb-3 px-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Roster</h2>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-xs">
            {availableMembers.length}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 text-sm bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
            />
              {searchQuery && (
                  <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-white transition-colors"
                  >
                    <MdOutlineCancel />
                  </button>
              )}

          </div>

          <div className="flex gap-1 flex-wrap">
            {['all', 3000, 5000, 7000, 9000].map((level) => (
              <Badge
                key={level}
                variant={filterLevel === level ? "default" : "outline"}
                className={`cursor-pointer transition-all text-xs px-2 py-0.5 ${
                  filterLevel === level 
                    ? 'bg-cyan-500 text-white' 
                    : 'border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
                }`}
                onClick={() => setFilterLevel(level)}
              >
                {level === 'all' ? 'All' : `${level / 1000}k+`}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <Droppable droppableId="roster">
        {(provided, snapshot) => (
          <CardContent 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-3 pb-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/50' : ''} ${isRosterClickable ? 'border-dashed border-cyan-500 cursor-pointer' : ''}`}
            onClick={() => isRosterClickable && onRosterClick()} // Make the CardContent clickable if isRosterClickable is true
          >
            <div className="space-y-1">
                {availableMembers.map((member, index) => (
                  <Draggable key={member.id} draggableId={member.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing"
                        onClick={(e) => { e.stopPropagation(); onPlayerClick?.(member); }} // Stop propagation to prevent CardContent's onClick
                      >
                        <PlayerCard 
                          member={member} 
                          isSelected={selectedPlayer?.id === member.id}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
            </div>
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}
