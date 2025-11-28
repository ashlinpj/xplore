import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { articlesAPI } from '../lib/api';

const DEFAULT_UPDATES = [
  "SpaceX Starship V3 launch confirmed for 10:00 AM EST",
  "Apple announces surprise event for new Vision Pro",
  "Bitcoin breaks $150k barrier amidst global adoption",
  "OpenAI releases GPT-6 with full reasoning capabilities",
  "Tesla Model 2 production starts in Mexico Gigafactory"
];

export function LiveTicker() {
  const [updates, setUpdates] = useState(DEFAULT_UPDATES);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const { data } = await articlesAPI.getLiveUpdates();
        if (data && data.length > 0) {
          setUpdates(data);
        }
      } catch (error) {
        console.log('Using default updates');
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 h-10 flex items-center overflow-hidden relative">
      <div className="bg-primary text-black font-bold px-4 h-full flex items-center z-10 text-xs uppercase tracking-wider">
        Live Updates
      </div>
      
      <div className="flex whitespace-nowrap overflow-hidden">
        <motion.div 
          className="flex gap-8 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        >
          {[...updates, ...updates].map((update, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-medium text-white">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {update}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default LiveTicker;
