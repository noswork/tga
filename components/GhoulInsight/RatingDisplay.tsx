import React from 'react';
import { GhoulThreatRating } from '../../types';

interface RatingDisplayProps {
  rating: GhoulThreatRating;
}

const getColor = (rating: GhoulThreatRating) => {
  switch (rating) {
    case GhoulThreatRating.SSS:
      return 'text-purple-500 border-purple-500 shadow-purple-900/50';
    case GhoulThreatRating.SS:
      return 'text-red-600 border-red-600 shadow-red-900/50';
    case GhoulThreatRating.S_PLUS:
    case GhoulThreatRating.S_MINUS:
      return 'text-red-500 border-red-500 shadow-red-900/50';
    case GhoulThreatRating.A:
      return 'text-orange-500 border-orange-500 shadow-orange-900/50';
    case GhoulThreatRating.B:
      return 'text-yellow-500 border-yellow-500 shadow-yellow-900/50';
    case GhoulThreatRating.C:
      return 'text-blue-400 border-blue-400 shadow-blue-900/50';
    default:
      return 'text-gray-500 border-gray-500';
  }
};

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating }) => {
  const colorClass = getColor(rating);
  const isSSS = rating === GhoulThreatRating.SSS;

  return (
    <div
      className={`relative group ${isSSS ? 'p-4 rainbow-border' : `p-3 border-2 ${colorClass}`} bg-black/80 inline-flex flex-col items-center justify-center aspect-square w-20 md:w-24 transition-all duration-500 transform hover:scale-105`}
      style={isSSS ? { overflow: 'visible', padding: '1rem' } : {}}
    >
      <span className="absolute top-0.5 left-1 text-[8px] font-mono tracking-widest opacity-70 z-10">THREAT LEVEL</span>
      <div className="relative flex items-center justify-center" style={isSSS ? { width: '100%', height: '100%', padding: '8px' } : {}}>
        <h1 
          className={`text-3xl md:text-4xl font-black italic tracking-tighter leading-none ${
            isSSS ? 'rainbow-text' : `${colorClass.split(' ')[0]} drop-shadow-md`
          }`}
        >
          {rating}
        </h1>
      </div>
      <div className="absolute bottom-0.5 right-1 flex gap-0.5">
        {isSSS ? (
          <>
            <div className="w-0.5 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-0.5 h-0.5 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.33s' }}></div>
            <div className="w-0.5 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.66s' }}></div>
          </>
        ) : (
          <>
            <div className={`w-0.5 h-0.5 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`}></div>
            <div className={`w-0.5 h-0.5 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`}></div>
            <div className={`w-0.5 h-0.5 ${colorClass.split(' ')[0].replace('text-', 'bg-')}`}></div>
          </>
        )}
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-current mix-blend-overlay transition-opacity duration-100"></div>
    </div>
  );
};

