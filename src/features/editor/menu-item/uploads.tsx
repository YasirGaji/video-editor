import React, { useState } from "react";
import { FileUploader } from "@/components/ui/file-uploader";
import { ScrollArea } from "@/components/ui/scroll-area";
import Draggable from "@/components/shared/draggable";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { IVideo } from "@designcombo/types";
import { createMultipleLocalVideos } from "../utils/local-video";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";

interface UploadedVideo {
  video: Partial<IVideo>;
  warning?: string;
}

export const Uploads = () => {
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const isDraggingOverTimeline = useIsDraggingOverTimeline();

  const handleAddVideo = (payload: Partial<IVideo>) => {
    dispatch(ADD_VIDEO, {
      payload,
      options: {
        resourceId: "main",
        scaleMode: "fit",
      },
    });
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError("");

    try {
      const results = await createMultipleLocalVideos(files);
      setUploadedVideos(prev => [...prev, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process videos");
    } finally {
      setIsProcessing(false);
    }
  };



  const clearUploads = () => {
    uploadedVideos.forEach(({ video }) => {
      if (video.details?.src && video.details.src.startsWith('blob:')) {
        URL.revokeObjectURL(video.details.src);
      }
      if (video.preview && video.preview.startsWith('blob:')) {
        URL.revokeObjectURL(video.preview);
      }
    });
    setUploadedVideos([]);
    setError("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 flex-none items-center justify-between px-4">
        <div className="text-text-primary text-sm font-medium">
          Uploads
        </div>
        {uploadedVideos.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearUploads}
            className="h-8 px-2"
          >
            <Icons.trash width={12} />
          </Button>
        )}
      </div>

      <ScrollArea>
        <div className="px-4 space-y-4">
          <FileUploader
            value={[]}
            onValueChange={handleFileUpload}
            accept={{ 
              "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v"]
            }}            
            maxFileCount={10}
            maxSize={4024 * 4024 * 4024}
            multiple
            disabled={isProcessing}
            className="min-h-[120px]"
          />

          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Processing videos...
              </span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Icons.warning className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm text-destructive">
                  {error}
                </div>
              </div>
            </div>
          )}

          {uploadedVideos.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Local Videos ({uploadedVideos.length})
              </div>
              <div className="masonry-sm">
                {uploadedVideos.map((item, index) => (
                  <VideoItem
                    key={`${item.video.id}-${index}`}
                    video={item.video}
                    warning={item.warning}
                    shouldDisplayPreview={!isDraggingOverTimeline}
                    handleAddVideo={handleAddVideo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const VideoItem = ({
  handleAddVideo,
  video,
  warning,
  shouldDisplayPreview,
}: {
  handleAddVideo: (payload: Partial<IVideo>) => void;
  video: Partial<IVideo>;
  warning?: string;
  shouldDisplayPreview: boolean;
}) => {
  const style = React.useMemo(
    () => ({
      backgroundImage: `url(${video.preview})`,
      backgroundSize: "cover",
      width: "80px",
      height: "80px",
    }),
    [video.preview],
  );

  return (
    <div className="space-y-1">
      <Draggable
        data={{
          ...video,
          metadata: {
            ...video.metadata,
            previewUrl: video.preview,
          },
        }}
        renderCustomPreview={<div style={style} className="draggable" />}
        shouldDisplayPreview={shouldDisplayPreview}
      >
        <div
          onClick={() => handleAddVideo(video)}
          className="flex w-full items-center justify-center overflow-hidden bg-background pb-2 cursor-pointer relative group"
        >
          <img
            draggable={false}
            src={video.preview}
            className="h-full w-full rounded-md object-cover"
            alt={video.name || "video"}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
            <Icons.add className="h-5 w-5 text-white" />
          </div>
        </div>
      </Draggable>
      
      {warning && (
        <div className="flex items-start gap-1 px-1">
          <Icons.warning className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-500 leading-tight">
            {warning}
          </div>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground truncate px-1">
        {video.name}
      </div>
    </div>
  );
};