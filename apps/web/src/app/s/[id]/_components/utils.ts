/** @deprecated Import from `@/features/report-viewer/lib/format-time` */
export {
  formatTimelineOffset as formatOffset,
  formatTimelineRowCaption as formatEventTimeLabel,
} from "@/features/report-viewer/lib/format-time"

export {
  coerceMissingOffsetsForVideo as applyVideoOffsetFallback,
  mapActionToTimelineEntry as buildActionEntry,
  mapLogToTimelineEntry as buildLogEntry,
  mapNetworkToTimelineEntry as buildNetworkEntry,
} from "@/features/report-viewer/lib/timeline-mappers"

export { entryIdsHighlightedAtPlaybackMs as getPlaybackEntryIds } from "@/features/report-viewer/lib/playback-highlight"
