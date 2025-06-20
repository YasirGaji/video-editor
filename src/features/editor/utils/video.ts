interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

interface AspectRatioValidation {
  isValid: boolean;
  warning?: string;
}

interface ProcessedVideo {
  blobUrl: string;
  thumbnailUrl: string;
  metadata: VideoMetadata;
  aspectRatioValidation: AspectRatioValidation;
}

const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp', '.ogv'
];

const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
  'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv',
  'video/3gpp', 'video/ogg'
];

const createVideoElement = (file: File): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const blobUrl = URL.createObjectURL(file);
    
    video.preload = 'metadata';
    video.muted = true;
    
    const cleanup = () => {
      URL.revokeObjectURL(blobUrl);
    };
    
    video.onloadedmetadata = () => {
      resolve(video);
    };
    
    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = blobUrl;
  });
};

export const extractVideoMetadata = async (file: File): Promise<VideoMetadata> => {
  const video = await createVideoElement(file);
  
  const metadata: VideoMetadata = {
    duration: video.duration * 1000,
    width: video.videoWidth,
    height: video.videoHeight,
  };

  console.log('Extracted metadata:', {
    fileName: file.name,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    videoDuration: video.duration,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight
  });
  
  URL.revokeObjectURL(video.src);
  
  return metadata;
};

export const generateVideoThumbnail = async (file: File, seekTime = 1): Promise<string> => {
  const video = await createVideoElement(file);
  
  return new Promise((resolve, reject) => {
    video.currentTime = Math.min(seekTime, video.duration);
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
      resolve(thumbnailUrl);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };
  });
};

export const createVideoBlobUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

export const validateVideoAspectRatio = (width: number, height: number): AspectRatioValidation => {
  const aspectRatio = width / height;
  const sixteenNineRatio = 16 / 9;
  const tolerance = 0.1;
  
  const isValid = Math.abs(aspectRatio - sixteenNineRatio) <= tolerance;
  
  if (isValid) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    warning: `Video aspect ratio is ${aspectRatio.toFixed(2)}:1. Recommended: 16:9 (1.78:1) for optimal display.`,
  };
};

export const processVideoFile = async (file: File): Promise<ProcessedVideo> => {
  try {
    const [metadata, thumbnailUrl] = await Promise.all([
      extractVideoMetadata(file),
      generateVideoThumbnail(file),
    ]);
    
    const blobUrl = createVideoBlobUrl(file);
    const aspectRatioValidation = validateVideoAspectRatio(metadata.width, metadata.height);
    
    return {
      blobUrl,
      thumbnailUrl,
      metadata,
      aspectRatioValidation,
    };
  } catch (error) {
    throw new Error(`Failed to process video file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const isVideoFile = (file: File): boolean => {
  if (file.type && SUPPORTED_VIDEO_MIME_TYPES.some(type => file.type.startsWith(type.split('/')[0]))) {
    return true;
  }
  
  const fileName = file.name.toLowerCase();
  const hasVideoExtension = SUPPORTED_VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  const hasVideoMimePattern = file.type.includes('video') || 
                             file.type.includes('mp4') || 
                             file.type.includes('webm') ||
                             file.type.includes('quicktime') ||
                             file.type.includes('x-msvideo');
  
  return hasVideoExtension || hasVideoMimePattern;
};