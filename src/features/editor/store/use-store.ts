/* eslint-disable @typescript-eslint/no-explicit-any */
import Timeline from "@designcombo/timeline";
import {
  ISize,
  ITimelineScaleState,
  ITimelineScrollState,
  ITrack,
  ITrackItem,
  ITransition,
} from "@designcombo/types";
import Moveable from "@interactify/moveable";
import { PlayerRef } from "@remotion/player";
import { create } from "zustand";

interface ITimelineStore {
  duration: number;
  fps: number;
  scale: ITimelineScaleState;
  scroll: ITimelineScrollState;
  size: ISize;
  tracks: ITrack[];
  trackItemIds: string[];
  transitionIds: string[];
  transitionsMap: Record<string, ITransition>;
  trackItemsMap: Record<string, ITrackItem>;
  trackItemDetailsMap: Record<string, any>;
  activeIds: string[];
  timeline: Timeline | null;
  setTimeline: (timeline: Timeline) => void;
  setScale: (scale: ITimelineScaleState) => void;
  setScroll: (scroll: ITimelineScrollState) => void;
  playerRef: React.RefObject<PlayerRef> | null;
  setPlayerRef: (playerRef: React.RefObject<PlayerRef> | null) => void;

  sceneMoveableRef: React.RefObject<Moveable> | null;
  setSceneMoveableRef: (ref: React.RefObject<Moveable>) => void;
  setState: (state: any) => Promise<void>;

  updateCanvasSize: (width: number, height: number) => void;
  adaptCanvasToVideo: (videoWidth: number, videoHeight: number) => void;
}

const calculateOptimalCanvasSize = (videoWidth: number, videoHeight: number) => {
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;
  
  if (videoWidth <= MAX_WIDTH && videoHeight <= MAX_HEIGHT) {
    return { width: videoWidth, height: videoHeight };
  }
  
  const aspectRatio = videoWidth / videoHeight;
  
  if (aspectRatio > 1) {
    const width = MAX_WIDTH;
    const height = Math.round(width / aspectRatio);
    return { width, height };
  } else {
    const height = MAX_HEIGHT;
    const width = Math.round(height * aspectRatio);
    return { width, height };
  }
};

const useStore = create<ITimelineStore>((set, get) => ({
  size: {
    width: 1080,
    height: 1920,
  },

  timeline: null,
  duration: 1000,
  fps: 30,
  scale: {
    // 1x distance (second 0 to second 5, 5 segments).
    index: 7,
    unit: 300,
    zoom: 1 / 300,
    segments: 5,
  },
  scroll: {
    left: 0,
    top: 0,
  },
  playerRef: null,
  trackItemDetailsMap: {},
  activeIds: [],
  targetIds: [],
  tracks: [],
  trackItemIds: [],
  transitionIds: [],
  transitionsMap: {},
  trackItemsMap: {},
  sceneMoveableRef: null,

  setTimeline: (timeline: Timeline) =>
    set(() => ({
      timeline: timeline,
    })),
  setScale: (scale: ITimelineScaleState) =>
    set(() => ({
      scale: scale,
    })),
  setScroll: (scroll: ITimelineScrollState) =>
    set(() => ({
      scroll: scroll,
    })),
  setState: async (state) => {
    return set({ ...state });
  },
  setPlayerRef: (playerRef: React.RefObject<PlayerRef> | null) =>
    set({ playerRef }),
  setSceneMoveableRef: (ref) => set({ sceneMoveableRef: ref }),

  updateCanvasSize: (width: number, height: number) => {
    console.log('Updating canvas size to:', { width, height });
    set({ 
      size: { 
        width, 
        height,
        type: 'video-adapted',
        name: `${width}x${height}`
      } 
    });
  },

adaptCanvasToVideo: (videoWidth: number, videoHeight: number) => {
    const currentState = get();
    
    const shouldAdapt = currentState.trackItemIds.length === 0 || 
                       Math.abs(currentState.size.width - videoWidth) > 100 ||
                       Math.abs(currentState.size.height - videoHeight) > 100;
    
    if (shouldAdapt) {
      const optimalSize = calculateOptimalCanvasSize(videoWidth, videoHeight);
      console.log('Adapting canvas to video:', {
        original: { width: videoWidth, height: videoHeight },
        adapted: optimalSize,
        reason: currentState.trackItemIds.length === 0 ? 'first video' : 'dimension change'
      });
      
      currentState.updateCanvasSize(optimalSize.width, optimalSize.height);
    }
  },
}));

export default useStore;
