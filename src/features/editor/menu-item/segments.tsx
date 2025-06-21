import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { FileUploader } from "@/components/ui/file-uploader";


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

export const Segments = () => {
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set());



  const parseCSV = (content: string): Segment[] => {
    const lines = content.trim().split('\n');
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return {
        index: parseInt(values[0]) || 0,
        start: values[1] || '',
        end: values[2] || '',
        text: values[3] || ''
      };
    });
  };

  const parseJSON = (content: string): SegmentData => {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return { segments: data };
    }
    
    return data;
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsProcessing(true);
    setError("");

    try {
      const content = await file.text();
      let parsedData: SegmentData;

      if (file.name.toLowerCase().endsWith('.csv')) {
        const segments = parseCSV(content);
        parsedData = { 
          title: file.name,
          segments 
        };
      } else if (file.name.toLowerCase().endsWith('.json')) {
        parsedData = parseJSON(content);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      setSegmentData(parsedData);
      console.log('Parsed segments:', parsedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSegmentSelection = (segmentIndex: number, isSelected: boolean) => {
  setSelectedSegments(prev => {
    const newSet = new Set(prev);
    if (isSelected) {
      newSet.add(segmentIndex);
    } else {
      newSet.delete(segmentIndex);
    }
    console.log('Selected segments:', Array.from(newSet));
    return newSet;
  });
};

  const clearSegments = () => {
    setSegmentData(null);
    setError("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 flex-none items-center justify-between px-4">
        <div className="text-text-primary text-sm font-medium">
          Segments
        </div>
        {segmentData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSegments}
            className="h-8 px-2"
          >
            <Icons.trash width={12} />
          </Button>
        )}
      </div>

      <ScrollArea>
        <div className="px-4 space-y-4">
          {!segmentData ? (
            <>
              <FileUploader
                value={[]}
                onValueChange={handleFileUpload}
                accept={{ 
                  "text/csv": [".csv"],
                  "application/json": [".json"]
                }}            
                maxFileCount={1}
                maxSize={10 * 1024 * 1024}
                disabled={isProcessing}
                className="min-h-[120px]"
              />

              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Processing file...
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
           

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {segmentData.title} ({segmentData.segments.length} segments)
                    </div>
                    {selectedSegments.size > 0 && (
                      <div className="text-xs font-medium text-primary">
                        {selectedSegments.size} selected
                      </div>
                    )}
                  </div>
                  
                  {selectedSegments.size > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Selected segments for export:', Array.from(selectedSegments));
                          // TODO: Implement export functionality
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        Export Selected ({selectedSegments.size})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSegments(new Set())}
                        className="h-7 px-2 text-xs"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}
                </div>
                  
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {segmentData.segments.map((segment) => (
                    <div
                      key={segment.index}
                      className="p-3 border border-border rounded-md hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedSegments.has(segment.index)}
                          onChange={(e) => handleSegmentSelection(segment.index, e.target.checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-medium text-primary">
                              Segment {segment.index}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {segment.start} → {segment.end}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {segment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
              </div>
            </>
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
        </div>
      </ScrollArea>
    </div>
  );
};