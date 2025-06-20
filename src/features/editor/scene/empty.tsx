import useStore from "../store/use-store";
import { useEffect, useRef, useState } from "react";
import { Droppable } from "@/components/ui/droppable";
import { PlusIcon } from "lucide-react";
import { DroppableArea } from "./droppable";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { createMultipleLocalVideos, validateVideoFile } from "../utils/local-video";
import { Icons } from "@/components/shared/icons";

const SceneEmpty = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [desiredSize, setDesiredSize] = useState({ width: 0, height: 0 });
  const { size } = useStore();

  useEffect(() => {
    const container = containerRef.current!;
    const PADDING = 96;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    const desiredZoom = Math.min(
      containerWidth / width,
      containerHeight / height,
    );
    setDesiredSize({
      width: width * desiredZoom,
      height: height * desiredZoom,
    });
    setIsLoading(false);
  }, [size]);

  const getFileType = (file: File): 'video' | 'image' | 'audio' | 'unknown' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  const processVideoFiles = async (videoFiles: File[]) => {
    if (videoFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingMessage(
      videoFiles.length === 1 
        ? `Processing ${videoFiles[0].name}...`
        : `Processing ${videoFiles.length} videos...`
    );

    try {
      const results = await createMultipleLocalVideos(videoFiles);
      
      results.forEach(({ video, warning }) => {
        dispatch(ADD_VIDEO, {
          payload: video,
          options: {
            resourceId: "main",
            scaleMode: "fit",
          },
        });

        if (warning) {
          console.warn(`${video.name}: ${warning}`);
        }
      });

      setProcessingMessage(
        results.length === 1 
          ? "Video added to timeline!"
          : `${results.length} videos added to timeline!`
      );

      setTimeout(() => {
        setProcessingMessage("");
      }, 2000);

    } catch (error) {
      setProcessingMessage(
        error instanceof Error ? error.message : "Failed to process videos"
      );
      
      setTimeout(() => {
        setProcessingMessage("");
      }, 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSelectFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const videoFiles: File[] = [];
    const imageFiles: File[] = [];
    const audioFiles: File[] = [];
    const unknownFiles: File[] = [];

    files.forEach(file => {
      const type = getFileType(file);
      switch (type) {
        case 'video': {
          const validation = validateVideoFile(file);
          if (validation.isValid) {
            videoFiles.push(file);
          } else {
            console.warn(`Skipping ${file.name}: ${validation.error}`);
          }
          break;
        }
        case 'image': {
          imageFiles.push(file);
          break;
        }
        case 'audio': {
          audioFiles.push(file);
          break;
        }
        default: {
          unknownFiles.push(file);
        }
      }
    });

    if (videoFiles.length > 0) {
      await processVideoFiles(videoFiles);
    }

    if (imageFiles.length > 0) {
      console.log("Image files:", imageFiles);
    }

    if (audioFiles.length > 0) {
      console.log("Audio files:", audioFiles);
    }

    if (unknownFiles.length > 0) {
      console.warn("Unsupported file types:", unknownFiles.map(f => f.name));
    }
  };

  return (
    <div ref={containerRef} className="absolute z-50 flex h-full w-full flex-1">
      {!isLoading ? (
        <Droppable
          maxFileCount={10}
          maxSize={4024 * 4024 * 4024} 
          disabled={isProcessing}
          onValueChange={onSelectFiles}
          className="h-full w-full flex-1 bg-background"
          accept={{
            "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v"],
            "image/*": [],
            "audio/*": [],
          }}
        >
          <DroppableArea
            onDragStateChange={setIsDraggingOver}
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center border border-dashed text-center transition-colors duration-200 ease-in-out ${
              isDraggingOver ? "border-white bg-white/10" : "border-white/15"
            }`}
            style={{
              width: desiredSize.width,
              height: desiredSize.height,
            }}
          >
            <div className="flex flex-col items-center justify-center gap-4 pb-12">
              {isProcessing ? (
                <>
                  <div className="rounded-md border bg-primary p-2 text-secondary">
                    <Icons.spinner className="h-5 w-5 animate-spin" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-px">
                    <p className="text-sm text-muted-foreground">
                      {processingMessage || "Processing files..."}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="hover:bg-primary-dark cursor-pointer rounded-md border bg-primary p-2 text-secondary transition-colors duration-200">
                    <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-px">
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground/70">
                      Or drag and drop files here
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Supports videos, images, and audio
                    </p>
                  </div>
                </>
              )}
              
              {processingMessage && !isProcessing && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {processingMessage}
                </div>
              )}
            </div>
          </DroppableArea>
        </Droppable>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background-subtle text-sm text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
};

export default SceneEmpty;