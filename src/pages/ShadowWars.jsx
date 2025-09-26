
import React, { useState, useEffect, useMemo, useContext, useRef  } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { PanelLeftClose, PanelLeftOpen, Hash, Zap, Icon } from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';
import WarRoom from '../components/war-rooms/WarRoom';
import PlayerRoster from '../components/player-roster/PlayerRoster';
import URLManagerModal from '../components/url-manager/URLManagerModal';
import { HeaderContext } from '../components/layout/HeaderContext';
import { listClans } from '@/api/entities';
import { toBlob } from 'html-to-image';
import SyncedRooms from '../components/war-rooms/SyncedRooms';


import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import clsx from 'clsx';

const LS_KEY = "shadowScout.roomsHash";

const TOTAL_ROOMS = 12;
const PLAYERS_PER_ROOM = 8;
const BATTLE_GROUPS = [
  { label: 'Battle +8', rooms: [1, 2, 3] },
  { label: 'Battle +4', rooms: [4, 5, 6] },
  { label: 'Battle +2', rooms: [7, 8, 9] },
  { label: 'Battle +1', rooms: [10, 11, 12] }
];

const HASH_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const HASH_RADIX = HASH_CHARS.length;
const PLAYER_ID_MULTIPLIER = 101; // Max player number (100) + 1

const toBase62 = (num) => {
    if (num === 0) return HASH_CHARS[0];
    let s = '';
    while (num > 0) {
        s = HASH_CHARS[num % HASH_RADIX] + s;
        num = Math.floor(num / HASH_RADIX);
    }
    return s;
};

const fromBase62 = (s) => {
    let num = 0;
    for (let i = 0; i < s.length; i++) {
        const charIndex = HASH_CHARS.indexOf(s[i]);
        if (charIndex === -1) {
            throw new Error(`Invalid character in hash: ${s[i]}`);
        }
        num = num * HASH_RADIX + charIndex;
    }
    return num;
};


export default function ShadowWars() {
  const [rooms, setRooms] = useState(
    Array(TOTAL_ROOMS).fill(null).map(() => Array(PLAYERS_PER_ROOM).fill(null))
  );
  const [clanMembers, setClanMembers] = useState([]);
  const [isDragging, setDragging] = useState(false);
  const [isRosterVisible, setIsRosterVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [currentHash, setCurrentHash] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [targetClanIndex, setTargetClanIndex] = useState(null);
  const { setHeaderText } = useContext(HeaderContext);
  const location = useLocation();
   const groupRefs = useRef({});

  const assignedPlayerIds = useMemo(() =>
    rooms.flat().filter((p) => p).map((p) => p.id),
    [rooms]
  );

 // Sort clan members by resonance (highest first)
const sortedClanMembers = useMemo(() => {
  if (!Array.isArray(clanMembers)) return [];
  return [...clanMembers].sort((a, b) => {
    const ra = Number(a?.resonance ?? 0);
    const rb = Number(b?.resonance ?? 0);
    return rb - ra; // highest first
  });
}, [clanMembers]);

// Sort players in each room by resonance
const sortedRooms = useMemo(() => {
  if (!Array.isArray(rooms)) return [];
  return rooms.map((room) => {
    if (!Array.isArray(room)) return [];
    return [...room].sort((a, b) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      const ra = Number(a?.resonance ?? 0);
      const rb = Number(b?.resonance ?? 0);
      return rb - ra;
    });
  });
}, [rooms]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      const urlParts = location.pathname.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const clanIndex = parseInt(lastPart) || null;
      //console.log(clanIndex);
      //console.log(lastPart);
      setTargetClanIndex(clanIndex);

      let membersData = [];
      let clanName = 'Clan Command'; // Default title

      if (clanIndex) {
        // Load from specific immortal clan
        const enemyClans = await listClans();
        const immortalClans = enemyClans.
          filter((c) => c.immortalRank > 0).
          sort((a, b) => (a.rank || 99) - (b.rank || 99));

        if (immortalClans[clanIndex - 1]) {
          const targetClan = immortalClans[clanIndex - 1];
          clanName = targetClan.name;
          membersData = (targetClan.members || []).map((member, idx) => ({
            ...member,
            id: `enemy_${clanIndex}_${idx}`,
            player_number: idx + 1
          }));
        } else {
          clanName = 'Unknown Immortal Clan';
        }
      } else {
        // Try to load "Паляниця[UA]" clan first, then fallback to ClanMember        
        const enemyClans = await listClans();
        const palyanytsiaClan = enemyClans.find((c) => c.id === 'Zhg/SM1poUE/Qfdp');
        //const members = await clanMembers()

        if (palyanytsiaClan && palyanytsiaClan.members) {
          clanName = palyanytsiaClan.name;
          membersData = palyanytsiaClan.members.map((member, idx) => ({
            ...member,
            id: `palyanytsya_${idx}`,
            player_number: idx + 1
          }));
        } else {
          clanName = 'Shadow Wars';
          // Fallback to ClanMember entity
          membersData = {}
        }
      }

      setHeaderText(clanName);
      setClanMembers(membersData);

      const urlHash = window.location.hash.replace(/^#/, "");
      const savedHash = localStorage.getItem(LS_KEY) || "";
      const hash = urlHash || savedHash;

      //const hash = window.location.hash.substring(1);
      if (hash && membersData.length > 0) {
        setRooms(decodeHashToRooms(hash, membersData));       
      } else {
        // Clear rooms if there's no hash
        setRooms(Array(TOTAL_ROOMS).fill(null).map(() => Array(PLAYERS_PER_ROOM).fill(null)));
      }
      setIsLoading(false);
    };
    initialize();
  }, [location.pathname, setHeaderText]);

  useEffect(() => {
    if (!isLoading) {
      const hash = encodeRoomsToHash(rooms); // Use rooms, not sortedRooms
      setCurrentHash(hash);
      if (hash) localStorage.setItem(LS_KEY, hash);
      else localStorage.removeItem(LS_KEY); 

      const pathname = window.location.pathname;
      const newUrl = hash ? `${pathname}#${hash}` : pathname;
      // Use replaceState to update the URL without adding to history
      window.history.replaceState(null, null, newUrl);
      
      // Check if running in an iframe
      if (window.self !== window.top) {
        // Post a message to the parent window with the new hash
        window.parent.postMessage({
          type: 'shadowScoutHashUpdate',
          hash: hash
        }, '*'); // For production, you might want to restrict this to your domain instead of '*'
      }
    }
  }, [rooms, isLoading]); // Depend on rooms state directly

  const encodeRoomsToHash = (roomsData) => {
    const assignments = [];
    roomsData.forEach((room, roomIndex) => {
        room.forEach((player, slotIndex) => {
            if (player) {
                const slotId = roomIndex * PLAYERS_PER_ROOM + slotIndex;
                const packed = slotId * PLAYER_ID_MULTIPLIER + player.player_number;
                assignments.push(toBase62(packed));
            }
        });
    });
    return assignments.join('.');
  };

// capture and download a specific group container
const downloadGroup = async (label) => {
  const el = groupRefs.current[label];
  if (!el) return;

  await document.fonts.ready; // ensure web fonts loaded
/*
  const canvas = await html2canvas(el, {
    backgroundColor: null,       // fallback background
    scale: 3,
    useCORS: true,                    // allow <img> cross-origin
    foreignObjectRendering: true,
  });
  */
  const opts = {
    pixelRatio: 3,               // sharper gradients/text
    cacheBust: true,             // avoid stale images
    backgroundColor: "transparent", // let your own bg show; or set '#0f172a'
    // If some external <img> taints canvas, you can filter them out:
    // filter: (node) => !(node.tagName === 'IMG' && !node.crossOrigin),
  };

  //const url = await toPng(el, opts);
  //const url_link = canvas.toDataURL("image/png");

  //const url = canvas.toDataURL("image/png");
  //const link = document.createElement("a");
  //link.href = url;
  //link.download = `battle-${label}.png`;
  //window.open(url, "_blank");
  const blob = await toBlob(el, opts);
  URL.createObjectURL(videoFile)
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob)
  link.href = url;
  window.open(url, "_blank");
  //link.click();
};

  const decodeHashToRooms = (hash, members) => {
    const newRooms = Array(TOTAL_ROOMS).fill(null).map(() => Array(PLAYERS_PER_ROOM).fill(null));
    if (!hash) {
      return newRooms;
    }
    try {
      const assignments = hash.split('.');
      assignments.forEach(code => {
          if (!code) return;
          const packed = fromBase62(code);
          const playerNum = packed % PLAYER_ID_MULTIPLIER;
          const slotId = Math.floor(packed / PLAYER_ID_MULTIPLIER);
          
          const player = members.find(m => m.player_number === playerNum);

          if (player && slotId < TOTAL_ROOMS * PLAYERS_PER_ROOM) {
              const roomIndex = Math.floor(slotId / PLAYERS_PER_ROOM); // Corrected variable name
              const slotIndex = slotId % PLAYERS_PER_ROOM;
              if (newRooms[roomIndex] && newRooms[roomIndex][slotIndex] === null) {
                 newRooms[roomIndex][slotIndex] = player;
              }
          }
      });
      return newRooms;
    } catch (e) {
      console.error("Failed to decode hash:", e);
      // Return empty rooms on error to prevent crashing
      return Array(TOTAL_ROOMS).fill(null).map(() => Array(PLAYERS_PER_ROOM).fill(null));
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const movingPlayer = clanMembers.find((m) => m.id.toString() === draggableId);
    if (!movingPlayer) return;

    const newRooms = JSON.parse(JSON.stringify(rooms));

    // Remove player from source
    if (source.droppableId.startsWith('room-')) {
      const roomNum = parseInt(source.droppableId.split('-')[1]);
      const playerIndex = newRooms[roomNum - 1].findIndex((p) => p?.id === movingPlayer.id);
      if (playerIndex > -1) newRooms[roomNum - 1][playerIndex] = null;
    }

    // Place player in destination
    if (destination.droppableId.startsWith('room-')) {
      const roomNum = parseInt(destination.droppableId.split('-')[1]);
      const emptySlotIndex = newRooms[roomNum - 1].indexOf(null);
      if (emptySlotIndex > -1) {
        newRooms[roomNum - 1][emptySlotIndex] = movingPlayer;
      } else {
        toast({ title: "Room Full", description: `Room ${roomNum} is full.`, variant: "destructive" });
        // Revert if room is full - we don't change state
        return;
      }
    }

    setRooms(newRooms);
    setSelectedPlayer(null); // Deselect after drag completes
  };

  const handlePlayerClick = (player) => {
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null); // Deselect if clicking the same player
    } else {
      setSelectedPlayer(player);
    }
  };

  const moveSelectedPlayerToRoom = (roomNumber) => {
    if (!selectedPlayer) return;

    const newRooms = JSON.parse(JSON.stringify(rooms));
    const targetRoom = newRooms[roomNumber - 1];
    const emptySlotIndex = targetRoom.indexOf(null);

    if (emptySlotIndex === -1) {
      toast({ title: "Room Full", description: `Room ${roomNumber} is full.`, variant: "destructive" });
      return;
    }

    // Remove player from any previous position
    for (let r = 0; r < TOTAL_ROOMS; r++) {
      const playerIndex = newRooms[r].findIndex((p) => p?.id === selectedPlayer.id);
      if (playerIndex > -1) newRooms[r][playerIndex] = null;
    }

    // Place player in the new room
    targetRoom[emptySlotIndex] = selectedPlayer;

    setRooms(newRooms);
    setSelectedPlayer(null);
  };

  const returnSelectedPlayerToRoster = () => {
    if (!selectedPlayer) return;

    const newRooms = JSON.parse(JSON.stringify(rooms));
    // Remove player from any room they might be in
    for (let r = 0; r < TOTAL_ROOMS; r++) {
      const playerIndex = newRooms[r].findIndex((p) => p?.id === selectedPlayer.id);
      if (playerIndex > -1) newRooms[r][playerIndex] = null;
    }

    setRooms(newRooms);
    setSelectedPlayer(null);
  };

  const handlePlayerRemove = (playerToRemove) => {
    if (!playerToRemove) return;
    const newRooms = JSON.parse(JSON.stringify(rooms));
    // Find the player in any room by their ID and remove them
    for (let r = 0; r < TOTAL_ROOMS; r++) {
      const playerIndex = newRooms[r].findIndex((p) => p?.id === playerToRemove.id);
      if (playerIndex > -1) {
        newRooms[r][playerIndex] = null;
        break; // Player found and removed, exit the loop
      }
    }
    setRooms(newRooms);
  };

  const clearAllRooms = () => {
    setRooms(Array(TOTAL_ROOMS).fill(null).map(() => Array(PLAYERS_PER_ROOM).fill(null)));
    setSelectedPlayer(null);
    toast({
      title: "Battlefield Cleared",
      description: "All players have been returned to the roster.",
      variant: "destructive"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Battlefield...</p>
        </div>
      </div>);

  }

  return (
    <DragDropContext
            onDragStart={() => setDragging(true)}
            onDragEnd={(result) => { setDragging(false); onDragEnd(result);}}>
      <div className="flex h-[calc(100dvh-70px)] pb-[env(safe-area-inset-bottom)]">
        <AnimatePresence>
          {isRosterVisible &&
         
            <motion.div
              initial={ false }
              animate={isDragging ? { opacity: 1, padding: '0.5rem' } : { opacity: 1, padding: '0.5rem' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="z-50 flex-shrink-0
              fixed inset-y-50 left-0
              h-[calc(100dvh-100px)]
              min-w-[306px] 2xl:min-w-[306px]
              pt-[env(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)]             
              ">
              <div className="h-full overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              <PlayerRoster
                clanMembers={sortedClanMembers}
                assignedPlayerIds={assignedPlayerIds}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterLevel={filterLevel}
                setFilterLevel={setFilterLevel}
                selectedPlayer={selectedPlayer}
                onPlayerClick={handlePlayerClick}
                onRosterClick={returnSelectedPlayerToRoster} />
              </div>

            </motion.div>

          }
        </AnimatePresence>
              
        <div id="rooms" className={clsx(
          "mx-auto flex-col ios-scroll pb-4",
           isRosterVisible ? "pl-[320px] xl:pl-[352px]" : "pl-0"
          )}
          >
          <div className="flex items-center justify-between mb-1 mt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsRosterVisible(!isRosterVisible)} className="bg-background text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-10 border-slate-600 hover:bg-slate-700">


              {isRosterVisible ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2 md:gap-4">
              <URLManagerModal
                currentHash={currentHash}
                rooms={sortedRooms ?? []}
                triggerButton={
                  <Button variant="outline" className="bg-background text-slate-700 px-2 py-2 text-xs font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-slate-600 hover:bg-slate-700 md:text-sm md:px-4">
                    <Hash className="w-4 h-4 mr-1 md:mr-2" />
                    Share
                  </Button>
                } />

              <Button variant="destructive" onClick={clearAllRooms} className="text-xs md:text-sm px-2 md:px-4">
                <Zap className="w-4 h-4 mr-1 md:mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="mb-4 space-y-6 md:space-y-8">
            {BATTLE_GROUPS.map((group) =>
              <section key={group.label}
                ref={(el) => (groupRefs.current[group.label] = el)}
                className=""              
              >
                <div className="flex items-center justify-center gap-1 md:gap-1">
                <h2 className="leading-none text-white mb-1 text-lg font-bold text-center md:text-xl md:mb-1">
                  {group.label}                  
                </h2>  
                {/*
                <Button type="button"  onClick={() => downloadGroup(group.label)}
                  title={`Download ${group.label}`}
                  className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 hover:bg-slate-700 px-2 py-1"
                >
                <Download className="w-4 h-4 text-cyan-300" />                  
                </Button> 
                */}               
                </div>
                {/*<div className="grid grid-cols-1 xl:grid-cols-3 gap-1 md:gap-1">*/}
                <SyncedRooms>
                  {group.rooms.map((roomNum, index) =>
                    <WarRoom
                      key={roomNum}
                      roomNumber={roomNum}
                      displayRoomNumber={index + 1}
                      players={sortedRooms[roomNum - 1]}
                      onPlayerRemove={handlePlayerRemove}
                      onRoomClick={moveSelectedPlayerToRoom}
                      onPlayerClick={handlePlayerClick}
                      selectedPlayer={selectedPlayer} />

                  )}
                </SyncedRooms>
              </section>
            )}
          </div>
        </div>
      </div>
    </DragDropContext>);

}
