import { IVideo } from "@designcombo/types";
import { generateId } from "@designcombo/timeline";
import { processVideoFile, isVideoFile } from "./video";
import useStore from "../store/use-store";

interface LocalVideoResult {
  video: Partial<IVideo>;
  warning?: string;
}

export const createLocalVideo = async (file: File): Promise<LocalVideoResult> => {
  if (!isVideoFile(file)) {
    throw new Error('Selected file is not a video');
  }

  try {
    const processed = await processVideoFile(file);

    const { adaptCanvasToVideo } = useStore.getState();
    adaptCanvasToVideo(processed.metadata.width, processed.metadata.height);
    
    const video: Partial<IVideo> = {
      id: generateId(),
      type: "video",
      name: file.name,
      preview: processed.thumbnailUrl,
      duration: processed.metadata.duration,
      details: {
        src: processed.blobUrl,
        width: processed.metadata.width,
        height: processed.metadata.height,
        volume: 1,
        blur: 0,
        brightness: 1,
        flipX: false,
        flipY: false,
        rotate: "0deg",
        visibility: "visible" as const,
        blob: file,
        crop: {
          x: 0,
          y: 0,
          width: processed.metadata.width,
          height: processed.metadata.height,
        },
      },
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        aspectRatio: processed.metadata.width / processed.metadata.height,
        isLocal: true,
        previewUrl: processed.thumbnailUrl,
      },
    };

    const result: LocalVideoResult = { video };
    
    if (!processed.aspectRatioValidation.isValid) {
      result.warning = processed.aspectRatioValidation.warning;
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to create local video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const createMultipleLocalVideos = async (files: File[]): Promise<LocalVideoResult[]> => {
  const videoFiles = files.filter(isVideoFile);
  
  if (videoFiles.length === 0) {
    throw new Error('No video files found in selection');
  }

  const results = await Promise.allSettled(
    videoFiles.map(file => createLocalVideo(file))
  );

  const processedResults: LocalVideoResult[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      processedResults.push(result.value);
    } else {
      errors.push(`${videoFiles[index].name}: ${result.reason.message}`);
    }
  });

  if (errors.length > 0 && processedResults.length === 0) {
    throw new Error(`Failed to process videos:\n${errors.join('\n')}`);
  }

  return processedResults;
};

export const validateVideoFile = (file: File): { isValid: boolean; error?: string } => {
  if (!isVideoFile(file)) {
    return {
      isValid: false,
      error: 'File must be a video format',
    };
  }

  return { isValid: true };
};