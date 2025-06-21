import { create } from "zustand";

interface Segment {
  index: number;
  start: string;
  end: string;
  text: string;
}

interface SegmentData {
  title?: string;
  videoSource?: string;
  segments: Segment[];
}

interface ParsedSegment {
  id: string;
  index: number;
  startTime: number; 
  endTime: number;   
  text: string;
  selected: boolean;
}

interface ISegmentsStore {
  segmentData: SegmentData | null;
  setSegmentData: (data: SegmentData | null) => void;
  
  segments: ParsedSegment[];
  
  selectedSegments: Set<number>;
  setSelectedSegments: (segments: Set<number>) => void;
  
  videoSource: string | null;
  setVideoSource: (source: string) => void;
  
  segmentTimelineId: string | null;
  setSegmentTimelineId: (id: string | null) => void;
  
  toggleSegmentSelection: (segmentIndex: number) => void;
  clearSelection: () => void;
  updateSegmentTimes: (segmentId: string, startTime: number, endTime: number) => void;
  
  getSelectedSegments: () => ParsedSegment[];
  getTotalDuration: () => number;
}

const parseTimeToMs = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return (minutes * 60 + seconds) * 1000;
  }
  return 0;
};

const msToTimeString = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const useSegmentsStore = create<ISegmentsStore>((set, get) => ({
  segmentData: null,
  segments: [],
  selectedSegments: new Set(),
  videoSource: null,
  segmentTimelineId: null,

  setSegmentData: (data) => {
    if (!data) {
      set({
        segmentData: null,
        segments: [],
        selectedSegments: new Set(),
      });
      return;
    }

    const parsedSegments: ParsedSegment[] = data.segments.map((segment) => ({
      id: `segment-${segment.index}`,
      index: segment.index,
      startTime: parseTimeToMs(segment.start),
      endTime: parseTimeToMs(segment.end),
      text: segment.text,
      selected: false,
    }));

    set({
      segmentData: data,
      segments: parsedSegments,
      selectedSegments: new Set(),
      videoSource: data.videoSource || null,
    });
  },

  setSelectedSegments: (segments) => {
    const currentSegments = get().segments;
    const updatedSegments = currentSegments.map(segment => ({
      ...segment,
      selected: segments.has(segment.index)
    }));

    set({
      selectedSegments: segments,
      segments: updatedSegments,
    });
  },

  setVideoSource: (source) => set({ videoSource: source }),
  
  setSegmentTimelineId: (id) => set({ segmentTimelineId: id }),

  toggleSegmentSelection: (segmentIndex) => {
    const { selectedSegments } = get();
    const newSelection = new Set(selectedSegments);
    
    if (newSelection.has(segmentIndex)) {
      newSelection.delete(segmentIndex);
    } else {
      newSelection.add(segmentIndex);
    }
    
    get().setSelectedSegments(newSelection);
  },

  clearSelection: () => {
    get().setSelectedSegments(new Set());
  },

  updateSegmentTimes: (segmentId, startTime, endTime) => {
    const { segments, segmentData } = get();
    
    const updatedSegments = segments.map(segment => {
      if (segment.id === segmentId) {
        return {
          ...segment,
          startTime,
          endTime,
        };
      }
      return segment;
    });

    if (segmentData) {
      const updatedSegmentData = {
        ...segmentData,
        segments: segmentData.segments.map(segment => {
          const parsedSegment = updatedSegments.find(s => s.id === segmentId);
          if (parsedSegment && segment.index === parsedSegment.index) {
            return {
              ...segment,
              start: msToTimeString(startTime),
              end: msToTimeString(endTime),
            };
          }
          return segment;
        }),
      };

      set({
        segments: updatedSegments,
        segmentData: updatedSegmentData,
      });
    } else {
      set({ segments: updatedSegments });
    }
  },

  getSelectedSegments: () => {
    const { segments } = get();
    return segments.filter(segment => segment.selected);
  },

  getTotalDuration: () => {
    const { segments } = get();
    if (segments.length === 0) return 0;
    
    const maxEndTime = Math.max(...segments.map(s => s.endTime));
    return maxEndTime;
  },
}));

export default useSegmentsStore;
export type { Segment, SegmentData, ParsedSegment };