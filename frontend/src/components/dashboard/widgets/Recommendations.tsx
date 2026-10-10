import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Recommendations() {
  const { plants, weather } = useData();
  const navigate = useNavigate();

  const weakest = plants.length ? plants.reduce((a, b) => (b.healthScore < a.healthScore ? b : a)) : null;

  let text: React.ReactNode;
  let question: string;
  let action = 'Ask AI Expert';

  if (!weakest) {
    text = <>Scan your first plant to get a <span className="font-semibold text-accent">personalised care plan</span>.</>;
    question = '';
    action = 'Scan a plant';
  } else if (weakest.healthScore < 80) {
    text = <>Your <span className="font-semibold text-accent">{weakest.name}</span> scored {weakest.healthScore}/100{weakest.disease && weakest.disease !== 'None' ? <> ({weakest.disease})</> : null}. Get a treatment plan now.</>;
    question = `My ${weakest.name} scored ${weakest.healthScore}/100 in a scan${weakest.disease && weakest.disease !== 'None' ? ` with ${weakest.disease}` : ''}. What exactly should I do to treat it?`;
  } else if (weather && weather.uvIndex >= 8) {
    text = <>UV is very high in {weather.city} today ({weather.uvIndex}). Move <span className="font-semibold text-accent">{weakest.name}</span> into bright, indirect light.</>;
    question = `UV index is ${weather.uvIndex} today. How do I protect my ${weakest.name} from sun damage?`;
  } else if (weather && weather.humidity < 40) {
    text = <>Humidity is only {weather.humidity}% in {weather.city}. Mist <span className="font-semibold text-accent">{weakest.name}</span> or use a pebble tray.</>;
    question = `Humidity is ${weather.humidity}%. How do I raise humidity for my ${weakest.name}?`;
  } else {
    text = <>All your plants look healthy. Keep <span className="font-semibold text-accent">{weakest.name}</span> on its current routine.</>;
    question = `My ${weakest.name} is healthy. Any tips to help it grow even better?`;
  }

  const handleClick = () => {
    if (!weakest) navigate('/scan-plant');
    else navigate('/ai-expert', { state: { question } });
  };

  return (
    <motion.div
      variants={itemVariants}
      onClick={handleClick}
      className="glass-card p-6 h-full flex flex-col relative overflow-hidden group cursor-pointer border-accent/30 hover:border-accent/60 transition-colors"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <BrainCircuit className="w-32 h-32 text-accent transform rotate-12" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-accent/20 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-accent">AI INSIGHT</h3>
        </div>

        <h4 className="text-xl font-light text-white mb-4 leading-tight">{text}</h4>

        <div className="mt-auto">
          <button className="flex items-center gap-2 text-sm text-black bg-accent px-4 py-2 rounded-xl font-medium hover:bg-accent-secondary transition-colors shadow-glow-accent">
            {action} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
