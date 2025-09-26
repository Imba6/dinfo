
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, Hand, Axe, Shield, Skull, Crosshair, Sword, Wind, Leaf, 
  Gem, Target, ShieldCheck, Flame, Sparkles, Heart, Swords 
} from 'lucide-react';

const classInfo = {
  sorcerer:     { icon: Wand2,          iconColor: 'text-blue-300',   cardClasses: 'bg-blue-950/40 border-blue-800/80 hover:border-blue-600',    badgeClasses: 'bg-blue-500/20 text-blue-300 border-blue-500/30',      statColor: 'text-blue-300' },
  monk:         { icon: Hand,           iconColor: 'text-yellow-300', cardClasses: 'bg-yellow-950/40 border-yellow-800/80 hover:border-yellow-600', badgeClasses: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',  statColor: 'text-yellow-300' },
  barbarian:    { icon: Axe,            iconColor: 'text-red-300',    cardClasses: 'bg-red-950/40 border-red-800/80 hover:border-red-600',       badgeClasses: 'bg-red-500/20 text-red-300 border-red-500/30',        statColor: 'text-red-300' },
  crusader:     { icon: Shield, iconColor: 'text-gray-300',   cardClasses: 'bg-gray-800/40 border-gray-700/80 hover:border-gray-500',        badgeClasses: 'bg-gray-500/20 text-gray-300 border-gray-500/30',      statColor: 'text-gray-300' },
  necromancer:  { icon: Skull,          iconColor: 'text-green-300',  cardClasses: 'bg-green-950/40 border-green-800/80 hover:border-green-600',    badgeClasses: 'bg-green-500/20 text-green-300 border-green-500/30',    statColor: 'text-green-300' },
  demon_hunter: { icon: Crosshair,      iconColor: 'text-purple-300', cardClasses: 'bg-purple-950/40 border-purple-800/80 hover:border-purple-600', badgeClasses: 'bg-purple-500/20 text-purple-300 border-purple-500/30',  statColor: 'text-purple-300' },
  blood_knight: { icon: Sword,          iconColor: 'text-rose-300',   cardClasses: 'bg-rose-950/40 border-rose-800/80 hover:border-rose-600',    badgeClasses: 'bg-rose-500/20 text-rose-300 border-rose-500/30',      statColor: 'text-rose-300' },
  tempest:      { icon: Wind,           iconColor: 'text-cyan-300',   cardClasses: 'bg-cyan-950/40 border-cyan-800/80 hover:border-cyan-600',      badgeClasses: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',      statColor: 'text-cyan-300' },
  druid:        { icon: Leaf,           iconColor: 'text-lime-300',   cardClasses: 'bg-lime-950/40 border-lime-800/80 hover:border-lime-600',      badgeClasses: 'bg-lime-500/20 text-lime-300 border-lime-500/30',      statColor: 'text-lime-300' },
};

const StatItem = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-1 w-14" title={label}>
    <Icon className="w-4 h-4 opacity-80 flex-shrink-0" />
    <span className="text-s font-mono font-medium">{value || 0}</span>
  </div>
);

export default function PlayerCard({ member, isSelected }) {
  const playerClass = member.class.toLowerCase().replace(' ', '_');
 const { icon: ClassIcon, iconColor, cardClasses, badgeClasses, statColor } = classInfo[playerClass] || classInfo.barbarian;
  
  const formatBasicStat = (value) => {
    if (!value) return 0;
    return Math.round(value);
  };

  const formatHealth = (value) => {
    if (!value) return '0k';
    const sign = value < 0 ? '-' : '';
    const v = Math.abs(value);

    // ≥ 1,000,000 → one decimal in "kk"
    if (v >= 1_000_000) {
      return `${sign}${(v / 1_000_000).toFixed(0)}kk`;
    }
    // otherwise round to whole "k"
    return `${sign}${Math.round(v / 1000)}k`;
  };

  const formatDamage = (value) => {
    if (!value) return '0';
    const sign = value < 0 ? '-' : '';
    const v = Math.abs(value);

    if (v >= 1_000_000) return `${sign}${Math.round(v / 1_000_000)}kk`;
    if (v >= 1_000)     return `${sign}${Math.round(v / 1_000)}k`;
    return `${sign}${Math.round(v)}`;
  };

  return (
    <Card className={`z-50 border-2 transition-all duration-200 ${
      isSelected 
        ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 scale-105' 
        : cardClasses
    }`}>
      <div className="pl-2 flex items-center gap-1">
        <div className={`hidden 4xl:flex w-8 h-8 rounded-md items-center justify-center flex-shrink-0 ${badgeClasses}`}>
          <ClassIcon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        
        <div className="flex-grow min-w-0">
          <p className="max-w-[16ch] truncate align-middle font-bold text-white text-sm" title={member.name}>{member.name}</p>
          <div className="flex items-center gap-1 mt-0">
            <Gem className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <span className="text-xs font-bold text-yellow-300">{member.resonance || 0}</span>
          </div>
          <Badge variant="outline" className={`text-xs mt-0 px-1 py-0 ${badgeClasses} whitespace-nowrap`}>
            {playerClass.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className={`grid grid-cols-2 gap-x-4 gap-y-0 mr-4 ${statColor} flex-shrink-0`}>
          <StatItem icon={ShieldCheck} value={formatBasicStat(member.armor)} label="Armor" />
          <StatItem icon={Target} value={formatBasicStat(member.armor_penetration)} label="Armor Penetration" />
          <StatItem icon={Flame} value={formatBasicStat(member.potency)} label="Potency" />
          <StatItem icon={Sparkles} value={formatBasicStat(member.resistance)} label="Resistance" />
          <StatItem icon={Heart} value={formatHealth(member.hp)} label="Health" />
          <StatItem icon={Swords} value={formatDamage(member.damage)} label="Damage" />
        </div>
      </div>
    </Card>
  );
}
