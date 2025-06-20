import Draggable from "@/components/shared/draggable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VIDEOS } from "../data/video";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import { IVideo } from "@designcombo/types";
import React, { useRef, useState } from "react";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { createLocalVideo } from "../utils/local-video";
import { Button } from "@/components/button";
import { Icons } from "@/components/shared/icons";

export const Videos = () => {
  const isDraggingOverTimeline = useIsDraggingOverTimeline();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddVideo = (payload: Partial<IVideo>) => {
    // payload.details.src = "https://cdn.designcombo.dev/videos/timer-20s.mp4";
    dispatch(ADD_VIDEO, {
      payload,
      options: {
        resourceId: "main", 
        scaleMode: "fit",
      },
    });
  };

    const handleLocalVideoUpload = async (file: File) => {
      setIsProcessing(true);
      setError("");
  
      try {
        const result = await createLocalVideo(file);
        
        if (result.warning) {
          console.warn(result.warning);
        }
        
        handleAddVideo(result.video);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process video");
      } finally {
        setIsProcessing(false);
      }
    };

      const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          handleLocalVideoUpload(file);
        }
        event.target.value = "";
      };
    
      const openFileDialog = () => {
        fileInputRef.current?.click();
      };

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Videos
      </div>

      <div className="px-4 pb-4 border-b border-border/50">
        <Button
          onClick={openFileDialog}
          disabled={isProcessing}
          className="w-full"
          variant="outline"
          size="sm"
        >
          {isProcessing ? (
            <>
              <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Icons.upload className="h-4 w-4 mr-2" />
              Load Local Video
            </>
          )}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.avi,.mov,.mkv,.webm,.flv,.wmv,.m4v"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {error && (
          <div className="mt-2 bg-destructive/10 border border-destructive/20 rounded-md p-2">
            <div className="flex items-start gap-2">
              <Icons.warning className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-xs text-destructive">
                {error}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollArea>
        <div className="masonry-sm px-4">
          {VIDEOS.map((video, index) => {
            return (
              <VideoItem
                key={index}
                video={video}
                shouldDisplayPreview={!isDraggingOverTimeline}
                handleAddImage={handleAddVideo}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const VideoItem = ({
  handleAddImage,
  video,
  shouldDisplayPreview,
}: {
  handleAddImage: (payload: Partial<IVideo>) => void;
  video: Partial<IVideo>;
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
    <Draggable
      data={{
        ...video,
        metadata: {
          previewUrl: video.preview,
        },
      }}
      renderCustomPreview={<div style={style} className="draggable" />}
      shouldDisplayPreview={shouldDisplayPreview}
    >
      <div
        onClick={() =>
          handleAddImage({
            id: generateId(),
            details: {
              src: video.details!.src,
            },
            metadata: {
              previewUrl: video.preview,
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
        }
        className="flex w-full items-center justify-center overflow-hidden bg-background pb-2"
      >
        <img
          draggable={false}
          src={video.preview}
          className="h-full w-full rounded-md object-cover"
          alt="image"
        />
      </div>
    </Draggable>
  );
};
