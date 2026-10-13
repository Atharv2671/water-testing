import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Droplet, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Maximize2, 
  Crosshair, 
  Info, 
  ArrowDown, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Route,
  Navigation,
  Compass,
  Map as MapIcon
} from 'lucide-react';
import { PathwayResolutionResult, PathwayResolvedZone } from '../types/gis';

interface PathwayPanelProps {
  pathway: PathwayResolutionResult | null;
  isLoading: boolean;
  onFocusZone: (zone: PathwayResolvedZone) => void;
  onFocusAddress: (coords: [number, number]) => void;
  onFocusRoute?: (coords: [number, number][]) => void;
  onReportIncident: (address?: string) => void;
  onClear: () => void;
}

export const PathwayPanel: React.FC<PathwayPanelProps> = ({
  pathway,
  isLoading,
  onFocusZone,
  onFocusAddress,
  onFocusRoute,
  onReportIncident,
  onClear,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mapMode, setMapMode] = useState<'current_gis' | 'google_maps'>('current_gis');
  const [showSegmentList, setShowSegmentList] = useState(false);

  if (!pathway && !isLoading) {
    return null;
  }

  const isVerified = pathway?.status === 'VERIFIED';
  const isAmbiguous = pathway?.status === 'AMBIGUOUS';
  const isNear = pathway?.status === 'NEAR_ZONE';
  const isUnmapped = pathway?.status === 'UNMAPPED_OUTSIDE_RETICULATION';
  const dijkstra = pathway?.dijkstraRoute;

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          Resolving Spatial Containment & Shortest Route...
        </span>
      );
    }
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Verified Spatial Assignment
        </span>
      );
    }
    if (isAmbiguous) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Boundary Overlap (Review Required)
        </span>
      );
    }
    if (isNear) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
          <Info className="w-3.5 h-3.5 text-sky-600" />
          Within Buffer Corridor ({pathway?.bufferTier?.distanceMeters ?? 0}m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
        <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
        Outside Reticulation Envelope
      </span>
    );
  };

  const handleOpenGoogleMaps = () => {
    if (!pathway) return;
    const url = dijkstra?.googleMapsDirectionsUrl || 
      `https://www.google.com/maps/dir/?api=1&origin=${pathway.coordinates[0]},${pathway.coordinates[1]}&destination=${pathway.supplyZone?.lat ?? -36.9125},${pathway.supplyZone?.lng ?? 174.6780}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside 
      aria-label="Address to Water Supply Pathway"
      className="absolute left-3 bottom-6 z-20 w-[94vw] sm:w-[420px] max-w-[440px] bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200 select-text"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#071A35] text-white flex items-center justify-between border-b border-[#0C2548] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-white/10 text-cyan-300">
            <Route className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold text-white tracking-wide truncate">
              Water Supply Pathway & Route
            </h2>
            <p className="text-[10px] text-slate-300 truncate font-mono">
              Dijkstra Shortest Path &bull; Te Mana o te Wai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded hover:bg-rose-900/40 text-slate-300 hover:text-white transition-colors"
            title="Clear selection and reset map highlight"
            aria-label="Clear selection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="max-h-[75vh] overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-slate-800">
          
          {/* Status Header Badge */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
            {getStatusBadge()}
            {pathway?.confidenceScore && (
              <span className="text-[10px] font-mono font-medium text-slate-500">
                Confidence: {(pathway.confidenceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoading && !pathway && (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded border border-slate-200" />
              <div className="h-6 w-1/2 mx-auto bg-slate-100 rounded" />
              <div className="h-20 bg-slate-100 rounded border border-slate-200" />
              <div className="h-6 w-1/2 mx-auto bg-slate-100 rounded" />
              <div className="h-20 bg-slate-100 rounded border border-slate-200" />
            </div>
          )}

          {pathway && (
            <>
              {/* MAP DESTINATION CHOOSER: Current GIS Map vs Google Maps */}
              <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMapMode('current_gis')}
                  className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    mapMode === 'current_gis'
                      ? 'bg-[#071A35] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View on current interactive Leaflet GIS platform"
                >
                  <MapIcon className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Current GIS Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('google_maps')}
                  className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    mapMode === 'google_maps'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Open driving navigation on Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </button>
              </div>

              {/* GOOGLE MAPS NAVIGATION VIEW */}
              {mapMode === 'google_maps' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      External Turn-by-Turn Navigation
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                      Driving Directions
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="bg-white p-2 rounded border border-blue-100 flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Origin Address</span>
                        <span className="font-semibold text-slate-800">{pathway.queriedAddress}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded border border-blue-100 flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Destination Supply Zone</span>
                        <span className="font-semibold text-slate-800">
                          {pathway.supplyZone?.zoneName || 'Supply Zone Hub'} ({pathway.supplyZone?.zoneId})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Google Maps with Origin & Destination</span>
                  </button>
                </div>
              )}

              {/* CORE ROAD PATHFINDING METRICS CARD */}
              {dijkstra && (
                <div className="rounded-lg border border-sky-300 bg-sky-50/70 p-3 space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <span className="p-1.5 rounded-md bg-[#071A35] text-cyan-300 mt-0.5 shrink-0">
                        <Route className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#071A35] block truncate">
                          Walkable & Vehicle Road Path
                        </span>
                        <span className="text-[10px] text-sky-800 font-medium">
                          A* Core Algorithm &bull; Strict Paved Roadways
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-[#071A35]">
                        {dijkstra.totalDistanceMeters.toLocaleString()} m
                      </div>
                      <div className="text-[10px] font-semibold text-sky-800 font-mono">
                        ({dijkstra.totalDistanceKm} km)
                      </div>
                    </div>
                  </div>

                  {/* Anti-Forest & Paved Corridor Guarantee Badge */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-[10px] font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Follows paved street network only &bull; Zero forest crossing</span>
                  </div>

                  {/* Road Corridor Breadcrumbs */}
                  {dijkstra.roadNames && dijkstra.roadNames.length > 0 && (
                    <div className="text-[10px] text-slate-600 bg-white p-2 rounded border border-sky-200 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Traversed Road Corridors</span>
                      <div className="flex flex-wrap items-center gap-1 font-semibold text-slate-800">
                        {dijkstra.roadNames.map((rName, rIdx) => (
                          <React.Fragment key={rIdx}>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{rName}</span>
                            {rIdx < dijkstra.roadNames!.length - 1 && <span className="text-slate-400">&rarr;</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] border-t border-sky-200">
                    <span className="text-slate-600 text-[10px]">
                      <strong>{dijkstra.segments.length}</strong> street segments ({dijkstra.computationTimeMs} ms)
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onFocusRoute && (
                        <button
                          type="button"
                          onClick={() => onFocusRoute(dijkstra.pathCoordinates)}
                          className="px-2 py-0.5 rounded bg-[#071A35] text-white hover:bg-[#0B254C] text-[10px] font-bold transition-colors shadow-2xs"
                          title="Fit map viewport to road path"
                        >
                          Focus Road Path
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowSegmentList(!showSegmentList)}
                        className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 text-[10px] font-bold transition-colors"
                      >
                        {showSegmentList ? 'Hide Steps' : 'View Steps'}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Step-by-Step Road Segments */}
                  {showSegmentList && (
                    <div className="mt-2 pt-2 border-t border-sky-200 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {dijkstra.segments.map((seg, idx) => (
                        <div key={idx} className="bg-white p-1.5 rounded border border-sky-100 text-[10px] flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="font-bold text-slate-800 block truncate">{idx + 1}. {seg.segmentName}</span>
                            <span className="text-slate-500 font-mono">{seg.pipeType || 'Paved Road'} &bull; Asphalt Surface</span>
                          </div>
                          <span className="font-bold font-mono text-sky-800 shrink-0">
                            {seg.distanceMeters} m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 1: SELECTED ADDRESS */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 relative group hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-700 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Selected Property Address
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug mt-0.5">
                        {pathway.queriedAddress}
                      </h3>
                      {(pathway.lotNumber || pathway.dpNumber || pathway.addressId) && (
                        <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                          {pathway.addressId && (
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium text-slate-700">
                              {pathway.addressId}
                            </span>
                          )}
                          {pathway.lotNumber && <span>{pathway.lotNumber}</span>}
                          {pathway.dpNumber && <span>{pathway.dpNumber}</span>}
                        </div>
                      )}
                      {pathway.nztm2000 && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1.5 bg-slate-100 px-2 py-0.5 rounded inline-block">
                          NZTM: {pathway.nztm2000.easting.toLocaleString()}m E, {pathway.nztm2000.northing.toLocaleString()}m N
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFocusAddress(pathway.coordinates)}
                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-[#071A35] hover:border-slate-300 transition-colors shrink-0 shadow-2xs"
                    title="Focus on address parcel"
                    aria-label="Focus on address parcel"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CONNECTOR 1: ADDRESS -> ZONE RELATIONSHIP */}
              <div className="flex flex-col items-center justify-center my-1">
                <div className="h-2.5 w-[2px] bg-sky-300" />
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs my-0.5">
                  <ArrowDown className="w-3 h-3 text-sky-600" />
                  <span>
                    {dijkstra 
                      ? `Shortest Distance: ${dijkstra.totalDistanceMeters}m to Centroid`
                      : isVerified 
                        ? 'Authoritative Point-in-Polygon Containment' 
                        : 'Spatial Lineage Assessment'}
                  </span>
                </div>
                <div className="h-2.5 w-[2px] bg-sky-300" />
              </div>

              {/* STAGE 2: ASSIGNED SUPPLY ZONE */}
              {pathway.supplyZone ? (
                <div className="rounded-lg border-2 border-sky-400 bg-sky-50/60 p-3 relative shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-700 shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-900 block">
                            Assigned Drinking Water Supply Zone
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-[#071A35] leading-snug mt-0.5">
                          {pathway.supplyZone.zoneName}
                        </h3>
                        <div className="text-[11px] text-slate-700 mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-300 font-bold text-sky-900">
                            {pathway.supplyZone.zoneId}
                          </span>
                          <span>&bull;</span>
                          <span><strong>Pop:</strong> {pathway.supplyZone.popRegist.toLocaleString()}</span>
                          {pathway.supplyZone.urbanRural && (
                            <>
                              <span>&bull;</span>
                              <span className="font-medium text-slate-600">{pathway.supplyZone.urbanRural}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFocusZone(pathway.supplyZone!)}
                      className="p-1.5 rounded-md bg-white border border-sky-300 text-sky-800 hover:bg-sky-100 transition-colors shrink-0 shadow-2xs"
                      title="Focus on complete zone boundary polygon"
                      aria-label="Focus on zone boundary polygon"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs text-slate-600">
                  <div className="font-bold text-slate-800">No Municipal Supply Zone Enclosure</div>
                  <div className="text-[11px] mt-0.5">
                    Location sits outside official registered reticulation zones. Private bore or rainwater harvesting likely.
                  </div>
                </div>
              )}

              {/* CONNECTOR 2: ZONE -> SCHEME RELATIONSHIP */}
              {pathway.supplyScheme && (
                <>
                  <div className="flex flex-col items-center justify-center my-1">
                    <div className="h-2.5 w-[2px] bg-indigo-300" />
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs my-0.5">
                      <ArrowDown className="w-3 h-3 text-indigo-600" />
                      <span>Reticulation Scheme Infrastructure</span>
                    </div>
                    <div className="h-2.5 w-[2px] bg-indigo-300" />
                  </div>

                  {/* STAGE 3: ASSOCIATED WATER SUPPLY SCHEME */}
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-700 shrink-0 mt-0.5">
                        <Droplet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                          Associated Drinking Water Scheme
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                          {pathway.supplyScheme.supplyName}
                        </h4>
                        <div className="text-[11px] text-slate-700 mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 font-semibold text-indigo-900">
                            {pathway.supplyScheme.supplyId}
                          </span>
                          <span>&bull;</span>
                          <span className="font-medium text-slate-800">{pathway.supplyScheme.supplierName}</span>
                        </div>

                        {pathway.supplyScheme.primaryTreatmentPlant && (
                          <div className="mt-2 text-[11px] bg-white p-2 rounded border border-indigo-100 space-y-1">
                            <div>
                              <span className="text-slate-500">Treatment Facility: </span>
                              <span className="font-semibold text-slate-800">{pathway.supplyScheme.primaryTreatmentPlant}</span>
                            </div>
                            {pathway.supplyScheme.waterQualityGrade && (
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                {pathway.supplyScheme.waterQualityGrade}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* WARNINGS & AUDIT ADVISORIES */}
              {pathway.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Spatial Boundary Advisory</span>
                  </div>
                  {pathway.warnings.map((w, i) => (
                    <div key={i} className="pl-5 leading-relaxed text-amber-800">
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* DATA PROVENANCE FOOTNOTE */}
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span className="truncate" title={pathway.dataProvenance}>
                  Provenance: {pathway.dataProvenance}
                </span>
                <span className="font-mono text-slate-400 shrink-0">WGS84 &bull; EPSG:2193</span>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {pathway.supplyZone && (
                  <button
                    type="button"
                    onClick={() => onFocusZone(pathway.supplyZone!)}
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#071A35] text-white hover:bg-[#0B254C] transition-colors text-xs font-bold shadow-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Focus Zone</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors text-xs font-bold shadow-xs"
                  title="Open in Google Maps navigation"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReportIncident(pathway.queriedAddress)}
                  className="px-3 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-[#071A35] transition-colors text-xs font-bold shadow-xs"
                  title="Report water contamination or incident for this address"
                >
                  Report
                </button>
              </div>
            </>
          )}

        </div>
      )}
    </aside>
  );
};
