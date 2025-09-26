
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { listClans } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Swords, Users, Search, Clock } from 'lucide-react';
import PlayerCard from '../components/player-roster/PlayerCard';
import { formatDistanceToNow } from 'date-fns';
import { MdOutlineCancel } from "react-icons/md";


const ClanDetailsModal = ({ clan, isOpen, onClose }) => {
  if (!clan) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-7xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{clan.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
          {(clan.members || [])
            .slice() // copy so we don’t mutate
            .sort((a, b) => (b?.resonance || 0) - (a?.resonance || 0))
            .map((member, index) => (
              <PlayerCard key={index} member={member} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ClansPage() {
  const [clans, setClans] = useState([]);
  const [selectedClan, setSelectedClan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('clan');

  useEffect(() => {
    const fetchClans = async () => {
      setIsLoading(true);
      const clansData = await listClans();   // <- your fetch wrapper
      // sort in JS by rank (assuming lower rank = better)
      clansData.sort((a, b) => a.rank - b.rank);
      setClans(clansData);
      setIsLoading(false);
    };
    fetchClans();
  }, []);

  const { immortalClans, shadowClans } = useMemo(() => {
    let filteredClans = clans;
    if (searchQuery.length > 2) {
      const lowerQuery = searchQuery.toLowerCase();
      if (searchType === 'clan') {
        filteredClans = clans.filter(c => c.name.toLowerCase().includes(lowerQuery));
      } else {
        filteredClans = clans.filter(c => c.members?.some(m => m.name.toLowerCase().includes(lowerQuery)));
      }
    }
    
    return {
      immortalClans: filteredClans.filter(c => c.immortalRank > 0).sort((a,b) => (a.immortalRank || 99) - (b.immortalRank || 99)),
      shadowClans: filteredClans.filter(c => c.immortalRank == 0).sort((a,b) => (a.rank || 999) - (b.rank || 999))
    };
  }, [clans, searchQuery, searchType]);


  const renderClanRow = (clan) => (
    <motion.div
        key={clan.id}
        layout
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="grid grid-cols-5 gap-4 items-center p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={() => setSelectedClan(clan)}
    >
        <div className="font-bold text-lg flex items-center gap-2 col-span-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${clan.type === 'immortal' ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
                {clan.type === 'immortal' ? <Crown className="text-yellow-400"/> : <Swords className="text-green-400"/>}
            </div>
            <span>{clan.name}</span>
        </div>
        <div className="text-center font-mono">{clan.rank || 'N/A'}</div>
        <div className="text-center">
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                <Users className="w-3 h-3 mr-1.5" />
                {clan.members?.length || 0}
            </Badge>
        </div>
        <div className="text-right text-sm text-slate-400 flex items-center justify-end gap-1.5">
            <Clock className="w-3 h-3" />
              <span title={new Date(clan.updated_at).toLocaleString()}>
                  {`${formatDistanceToNow(new Date(clan.updated_at))} ago`}
              </span>
        </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        {/* The h1 header text "Top Clans" has been removed as per the outline. */}
        <div className="flex items-center gap-2 w-full max-w-lg">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
                <Input 
                    placeholder={`Search by ${searchType === 'clan' ? 'Clan Name' : 'Player Name'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
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
            <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="clan">Clan Name</SelectItem>
                    <SelectItem value="player">Player Name</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {isLoading ? <p className="text-slate-400">Loading Intel...</p> : (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Immortal Clans</h2>
                <div className="space-y-3">{immortalClans.length > 0 ? immortalClans.map(renderClanRow) : <p className="text-slate-400">No matching Immortal clans found.</p>}</div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-green-400 mb-4">Shadow Clans</h2>
                <div className="space-y-3">{shadowClans.length > 0 ? shadowClans.map(renderClanRow) : <p className="text-slate-400">No matching Shadow clans found.</p>}</div>
            </div>
        </div>
      )}
      
      <ClanDetailsModal 
        clan={selectedClan}
        isOpen={!!selectedClan}
        onClose={() => setSelectedClan(null)}
      />
    </div>
  );
}
