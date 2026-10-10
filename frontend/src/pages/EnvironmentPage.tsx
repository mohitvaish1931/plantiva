import React, { useState, useMemo } from 'react';
import { CloudRain, ThermometerSun, Droplets, Sun, RefreshCw, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '../utils';
import { useData } from '../context/DataContext';
import { LocationMap } from '../components/LocationMap';

type Metric = 'temp' | 'humidity' | 'pop';

function tempStatus(t: number) {
  if (t > 35) return { label: 'Too Hot', cls: 'bg-red-500/20 text-red-400' };
  if (t < 10) return { label: 'Too Cold', cls: 'bg-blue-500/20 text-blue-400' };
  if (t >= 18 && t <= 30) return { label: 'Optimal', cls: 'bg-accent/20 text-accent' };
  return { label: 'Fair', cls: 'bg-yellow-500/20 text-yellow-500' };
}

function humidityStatus(h: number) {
  if (h < 40) return { label: 'Low', cls: 'bg-yellow-500/20 text-yellow-500' };
  if (h > 80) return { label: 'High', cls: 'bg-yellow-500/20 text-yellow-500' };
  return { label: 'Optimal', cls: 'bg-accent/20 text-accent' };
}

function uvStatus(uv: number) {
  if (uv >= 8) return { label: 'Very High', cls: 'bg-red-500/20 text-red-400' };
  if (uv >= 6) return { label: 'High', cls: 'bg-yellow-500/20 text-yellow-500' };
  return { label: uv >= 3 ? 'Moderate' : 'Low', cls: 'bg-accent/20 text-accent' };
}

export function EnvironmentPage() {
  const { weather, weatherLoading, weatherError, locationSource, refreshWeather } = useData();
  const [activeMetric, setActiveMetric] = useState<Metric>('temp');

  const envData = useMemo(() => {
    if (!weather) return [];
    return [
      { time: 'Now', temp: weather.temp, humidity: weather.humidity, pop: weather.precipitation },
      ...weather.forecast.map(f => ({ time: f.time, temp: f.temp, humidity: f.humidity, pop: f.pop })),
    ];
  }, [weather]);

  const details = {
    temp: { color: '#ef4444', label: 'Temperature (°C)', current: weather ? `${weather.temp}°C` : '--' },
    humidity: { color: '#3b82f6', label: 'Humidity (%)', current: weather ? `${weather.humidity}%` : '--' },
    pop: { color: '#06b6d4', label: 'Chance of Rain (%)', current: weather ? `${weather.precipitation}%` : '--' },
  }[activeMetric];

  const t = weather ? tempStatus(weather.temp) : null;
  const h = weather ? humidityStatus(weather.humidity) : null;
  const u = weather ? uvStatus(weather.uvIndex) : null;
  const place = weather ? [weather.area, weather.city, weather.country].filter(Boolean).join(', ') : '';

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Micro-Climate</h1>
          <p className="text-gray-400 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {place || (weatherLoading ? 'Finding your location...' : 'Location unavailable')}
          </p>
        </div>

        <button
          onClick={() => refreshWeather()}
          disabled={weatherLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-card border border-border text-white hover:bg-card-hover transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("w-4 h-4 text-accent", weatherLoading && "animate-spin")} />
          {weatherLoading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {weatherError && (
        <div className="p-4 rounded-2xl border border-warning/30 bg-warning/10 text-sm text-warning">{weatherError}</div>
      )}
      {locationSource === 'ip' && (
        <div className="p-4 rounded-2xl border border-warning/30 bg-warning/10 text-sm text-gray-300">
          Location access is off, so this is an approximate location based on your network. Allow location access in your browser and tap Refresh for exact local weather.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setActiveMetric('temp')}
            className={cn("glass-card border rounded-3xl p-6 cursor-pointer transition-all", activeMetric === 'temp' ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-border hover:border-white/20")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ThermometerSun className="w-6 h-6 text-red-500" />
              </div>
              {t && <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", t.cls)}>{t.label}</span>}
            </div>
            <p className="text-gray-400 text-sm mb-1">Temperature</p>
            <h3 className="text-3xl font-light text-white">{weather ? `${weather.temp}°C` : '--'}</h3>
            {weather && <p className="text-xs text-gray-500 mt-1">Feels like {weather.feelsLike}°C · {weather.description}</p>}
          </div>

          <div
            onClick={() => setActiveMetric('humidity')}
            className={cn("glass-card border rounded-3xl p-6 cursor-pointer transition-all", activeMetric === 'humidity' ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-border hover:border-white/20")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              {h && <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", h.cls)}>{h.label}</span>}
            </div>
            <p className="text-gray-400 text-sm mb-1">Humidity</p>
            <h3 className="text-3xl font-light text-white">{weather ? `${weather.humidity}%` : '--'}</h3>
            {weather && <p className="text-xs text-gray-500 mt-1">Wind {weather.windSpeed} km/h · Air {weather.aqiStatus}</p>}
          </div>

          <div
            onClick={() => setActiveMetric('pop')}
            className={cn("glass-card border rounded-3xl p-6 cursor-pointer transition-all", activeMetric === 'pop' ? "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-border hover:border-white/20")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Sun className="w-6 h-6 text-yellow-500" />
              </div>
              {u && <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", u.cls)}>UV {u.label}</span>}
            </div>
            <p className="text-gray-400 text-sm mb-1">UV Index & Rain</p>
            <h3 className="text-3xl font-light text-white">{weather ? weather.uvIndex : '--'}</h3>
            {weather && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><CloudRain className="w-3 h-3" /> {weather.precipitation}% chance of rain in the next 3h</p>}
          </div>
        </div>

        {/* Big Chart */}
        <div className="lg:col-span-2 glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between mb-8 gap-2">
            <h3 className="text-lg font-medium text-white">{details.label} · next 24h</h3>
            <div className="flex items-center gap-2 text-sm shrink-0">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: details.color }} />
              <span className="text-gray-400">Now: <span className="text-white font-medium">{details.current}</span></span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {envData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                {weatherLoading ? 'Loading forecast...' : 'Forecast unavailable'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={envData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={details.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={details.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} domain={activeMetric === 'temp' ? ['dataMin - 2', 'dataMax + 2'] : [0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(16,20,18,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey={activeMetric} name={details.label} stroke={details.color} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Map & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card border border-border rounded-3xl overflow-hidden h-64 relative">
            {weather ? (
              <LocationMap lat={weather.lat} lon={weather.lon} label={place} approximate={locationSource === 'ip'} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No location yet</div>
            )}
          </div>

          <div className="glass-card border border-border rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Data Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-400">Location</span>
                <span className="text-sm font-medium text-white flex items-center gap-2 text-right">
                  <span className={cn("w-2 h-2 rounded-full", locationSource === 'ip' ? 'bg-warning' : 'bg-accent')}></span>
                  {locationSource === 'gps' ? 'GPS' : locationSource === 'saved' ? 'Last GPS fix' : locationSource === 'ip' ? 'Approximate (IP)' : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Last Updated</span>
                <span className="text-sm font-medium text-white">{weather ? new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Coordinates</span>
                <span className="text-sm font-medium text-white">{weather ? `${weather.lat.toFixed(3)}, ${weather.lon.toFixed(3)}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Source</span>
                <span className="text-sm font-medium text-accent">OpenWeather</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
