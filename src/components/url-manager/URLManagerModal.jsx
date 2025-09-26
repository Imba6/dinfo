import React, {useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Upload, Share2, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useParams  } from 'react-router-dom';


export default function URLManagerModal({ currentHash, groupRefs, triggerButton, rooms }) {
  const [customHash, setCustomHash] = React.useState('');
  const [open, setOpen] = useState(false);
  const { id } = useParams(); // will be "1", "2", "3", or undefined
  const [images, setImages] = useState([]);

  // Refs for each battle group container

  // Group definition: 3 rooms each, with their labels
  const groups = [
    { label: "+8", rooms: rooms.slice(0, 3)},
    { label: "+4", rooms: rooms.slice(3, 6)},
    { label: "+2", rooms: rooms.slice(6, 9)},
    { label: "+1", rooms: rooms.slice(9, 12)},
  ];

  //console.log(groups);

  const copyToClipboard = async () => {
    const urlstring = id ? `https://imbaw.com/diablo/${id}` : 'https://imbaw.com/diablo';
    const shareUrl = currentHash ? `${urlstring}#${currentHash}` : `${urlstring}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "URL Copied!",
        description: "Battle configuration URL copied to clipboard.",
      });
    } catch (err) {
      // Fallback for older browsers or when clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "URL Copied!",
          description: "Battle configuration URL copied to clipboard.",
        });
      } catch (fallbackErr) {
        toast({
          title: "Copy Failed",
          description: "Could not copy URL. Please copy manually.",
          variant: "destructive"
        });
      }
      document.body.removeChild(textArea);
    }
  };

 const generateBattleSetupText = () => {
    //console.log(rooms);
    if (!rooms) return '';
    
    let battleText = '';
    
    groups.forEach((group) => {
      battleText += `${group.label}\n\n`;
      
      group.rooms.forEach((roomNum, index) => {
        const roomIndex = index;
        const roomPlayers = group.rooms[roomIndex] || [];

        //console.log(roomIndex);
        //console.log(roomPlayers);
        
        battleText += `#[${index + 1}]\n`;
        
        // Add players (up to 8)
        for (let i = 0; i < 8; i++) {
          const player = roomPlayers[i];
          if (player && player.name) {
            battleText += i < 7 ? `${player.name} |\n` : `${player.name}\n`;
          } else {
            //battleText += ' |\n';
          }
        }
        
        battleText += '\n';
      });
      
      battleText += '\n';
    });
    
    return battleText.trim();
  };

  const copyBattleSetup = async () => {
    const battleSetupText = generateBattleSetupText();
    
    try {
      await navigator.clipboard.writeText(battleSetupText);
      toast({
          title: "Battle Setup Copied!",
          description: "Battle configuration copied to clipboard in game format.",
        });
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = battleSetupText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: "Battle Setup Copied!",
            description: "Battle configuration copied to clipboard in game format.",
          });
        } catch (fallbackErr) {
          toast({
            title: "Copy Failed",
            description: "Could not copy battle setup. Please copy manually.",
            variant: "destructive"
          });
        }
        document.body.removeChild(textArea);
      }
    };      
      

  const urlstring = id ? `https://imbaw.com/diablo/${id}` : 'https://imbaw.com/diablo';
  const shareUrl = currentHash ? `${urlstring}#${currentHash}` : `${urlstring}`;
  //const shareUrl = currentHash ? `https://imbaw.com/diablo#${currentHash}` : 'https://imbaw.com/diablo';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Battle Configuration
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400">Battle Configuration URL</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy URL
              </Button>
            </div>
            <div className="p-3 bg-slate-800 rounded border border-slate-600 text-sm text-slate-300 font-mono break-all">
              {shareUrl}
            </div>
            <p className="text-xs text-slate-500">Share this URL to let others see your exact battle room setup</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400">Battle Setup for Game</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyBattleSetup}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
              >
                <FileText className="w-4 h-4 mr-1" />
                Copy Setup
              </Button>
            </div>
            <div className="p-3 bg-slate-800 rounded border border-slate-600 text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
              {generateBattleSetupText() || 'No players assigned to rooms yet...'}
            </div>
            <p className="text-xs text-slate-500">Copy this formatted text to paste directly in your game chat</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}