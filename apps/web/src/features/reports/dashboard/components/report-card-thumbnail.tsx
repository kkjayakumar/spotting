"use client"

import { Badge } from "@spotting/ui/components/ui/badge"
import { Clapperboard, ImageIcon, Play } from "lucide-react"
import Image from "next/image"
import { type SyntheticEvent, useCallback, useRef } from "react"

import type { ReportGridItem } from "../types"

export function ReportCardThumbnail({ report }: { report: ReportGridItem }) {
  if (report.thumbnail) {
    return (
      <Image
        alt={report.title}
        className="object-cover transition-transform group-hover:scale-105"
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 20vw"
        src={report.thumbnail}
      />
    )
  }

  if (report.attachmentType === "video" && report.attachmentUrl) {
    return <VideoFramePreview src={report.attachmentUrl} />
  }

  if (report.attachmentType === "screenshot" && report.attachmentUrl) {
    return (
      <Image
        alt={report.title}
        className="object-cover transition-transform group-hover:scale-105"
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 20vw"
        src={report.attachmentUrl}
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Play className="h-12 w-12 text-muted-foreground" />
    </div>
  )
}

export function ReportMediaKindBadge({
  attachmentType,
}: {
  attachmentType: ReportGridItem["attachmentType"]
}) {
  if (attachmentType === "video") {
    return (
      <Badge className="border-white/15 bg-black/75 text-white backdrop-blur-sm hover:bg-black/75">
        <Clapperboard className="size-3" />
        Video
      </Badge>
    )
  }

  if (attachmentType === "screenshot") {
    return (
      <Badge className="border-white/15 bg-black/75 text-white backdrop-blur-sm hover:bg-black/75">
        <ImageIcon className="size-3" />
        Screenshot
      </Badge>
    )
  }

  return null
}

function VideoFramePreview({ src }: { src: string }) {
  const didSeekRef = useRef(false)

  const primeFrame = useCallback((event: SyntheticEvent<HTMLVideoElement>) => {
    if (didSeekRef.current) {
      return
    }

    const element = event.currentTarget
    const totalSeconds =
      Number.isFinite(element.duration) && element.duration > 0
        ? element.duration
        : 0
    const seekTarget =
      totalSeconds > 0
        ? Math.min(Math.max(totalSeconds * 0.2, 0.15), totalSeconds / 2)
        : 0

    didSeekRef.current = true

    if (seekTarget <= 0) {
      return
    }

    const pauseAfterSeek = () => {
      element.pause()
    }

    element.addEventListener("seeked", pauseAfterSeek, { once: true })

    try {
      element.currentTime = seekTarget
    } catch {
      didSeekRef.current = false
    }
  }, [])

  return (
    <>
      <video
        aria-hidden="true"
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        muted
        onLoadedMetadata={primeFrame}
        playsInline
        preload="metadata"
        src={src}
        tabIndex={-1}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-white/20 bg-black/60 p-3 text-white shadow-sm backdrop-blur-sm">
          <Play className="size-5 fill-current" />
        </div>
      </div>
    </>
  )
}
