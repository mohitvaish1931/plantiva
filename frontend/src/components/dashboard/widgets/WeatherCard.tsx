import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, MapPin, RefreshCw, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, Moon } from 'lucide-react';
import { cn } from '../../../utils';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const AQI_COLOR: Record<number, string> = {
  1: 'text-accent',
  2: 'text-accent',
  3: 'text-warning',
  4: 'text-red-400',
  5: 'text-red-400',
};

export function WeatherIcon({ description, className }: { description?: string; className?: string }) {
  const d = (description || '').toLowerCase();
  const night = new Date().getHours() >= 19 || new Date().getHours() < 6;
  if (d.includes('thunder')) return <CloudLightning className={cn(className, 'text-yellow-300')} />;
  if (d.includes('rain') || d.includes('drizzle')) return <CloudRain className={cn(className, 'text-blue-400')} />;
  if (d.includes('snow')) return <CloudSnow className={cn(className, 'text-blue-200')} />;
  if (d.includes('mist') || d.includes('fog') || d.includes('haze') || d.includes('smoke') || d.includes('dust')) return <CloudFog className={cn(className, 'text-gray-400')} />;
  if (d.includes('cloud')) return <Cloud className={cn(className, 'text-gray-400')} />;
  return night ? <Moon className={cn(className, 'text-blue-200')} /> : <Sun className={cn(className, 'text-yellow-400')} />;
}

export function WeatherCard() {
  const { weather, weatherLoading, weatherError, locationSource, refreshWeather } = useData();

  const updated = weather ? new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const sourceLabel = locationSource === 'gps' ? 'GPS location'
    : locationSource === 'saved' ? 'Last GPS location'
    : locationSource === 'ip' ? 'Approximate (allow location for accuracy)'
    : 'Locating...';

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4 gap-2">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">LOCAL ENVIRONMENT</h3>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-xs text-gray-400 min-w-0" title={weather?.area ? `${weather.area}, ${weather.city}` : weather?.city}>
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{weather?.city || (weatherLoading ? 'Locating...' : 'Unknown')}</span>
          </div>
          <button
            onClick={() => refreshWeather()}
            disabled={weatherLoading}
            title="Refresh weather and location"
            className="p-1 rounded-full hover:bg-card-hover transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn("w-3 h-3 text-accent", weatherLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {weatherError && !weather ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 mb-4">
          <p className="text-sm text-gray-400">{weatherError}</p>
          <button onClick={() => refreshWeather()} className="text-xs px-3 py-1.5 rounded-lg bg-accent text-black font-semibold">
            Try again
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4 mb-6">
          <WeatherIcon description={weather?.description} className="w-12 h-12 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-light">{weather ? weather.temp : '--'}°</span>
              {weather && <span className="text-xs text-gray-400">feels {weather.feelsLike}°</span>}
            </div>
            <p className="text-sm font-medium capitalize">{weather?.description || 'Loading...'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Humidity: {weather ? `${weather.humidity}%` : '--'} • Wind: {weather ? `${weather.windSpeed} km/h` : '--'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-card/50 p-2 rounded-lg border border-border">
            <p className="text-gray-400 mb-1">AQI</p>
            <p className={cn("font-semibold", AQI_COLOR[weather?.aqi ?? 0] || 'text-gray-300')}>
              {weather?.aqiStatus || '--'} <span className="float-right">{weather?.aqi || ''}</span>
            </p>
          </div>
          <div className="bg-card/50 p-2 rounded-lg border border-border">
            <p className="text-gray-400 mb-1">UV</p>
            <p className={cn("font-semibold", (weather?.uvIndex ?? 0) >= 6 ? 'text-warning' : 'text-accent')}>
              {weather?.sunImpact || '--'} <span className="float-right">{weather ? weather.uvIndex : ''}</span>
            </p>
          </div>
          <div className="bg-card/50 p-2 rounded-lg border border-border">
            <p className="text-gray-400 mb-1">Rain</p>
            <p className="font-semibold text-blue-400">{weather ? `${weather.precipitation}%` : '--'}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between text-xs mb-1 gap-2">
            <span className="text-gray-400 flex items-center gap-1 truncate">
              <span className={cn("w-2 h-2 rounded-full shrink-0", locationSource === 'ip' ? 'bg-warning' : 'bg-accent animate-pulse-glow')} /> {sourceLabel}
            </span>
            <span className="text-accent font-medium shrink-0">{updated ? `Updated ${updated}` : 'Syncing'}</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              key={weather?.updatedAt}
              initial={{ width: 0 }}
              animate={{ width: weatherLoading ? '60%' : '100%' }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-accent shadow-glow-accent"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
