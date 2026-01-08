import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Send, Check, Loader2, Eye, X, Download, Printer, FileText } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContent, createEmailLog } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useContentDeliveryMode } from "@/hooks/use-feature-flags";

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  imageUrl: string | null;
  readTime: string | null;
}

export default function LibraryPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isPacketModalOpen, setIsPacketModalOpen] = useState(false);
  const [patientEmail, setPatientEmail] = useState("");
  const [providerNote, setProviderNote] = useState("");
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isPacketMode, isLoading: isLoadingMode } = useContentDeliveryMode();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ["content"],
    queryFn: getContent,
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    contentItems.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [contentItems]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery("");
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      return createEmailLog({
        patientEmail,
        subject: "Your Personalized Education Materials",
        type: "content_bundle",
        contentIds: selectedItems,
        providerNote: providerNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailLogs"] });
      toast({
        title: "Content Sent",
        description: `Successfully sent ${selectedItems.length} modules to ${patientEmail}.`,
      });
      setSelectedItems([]);
      setPatientEmail("");
      setProviderNote("");
      setIsSendModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => item.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const toggleSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      setSelectedItems(prev => [...prev, id]);
    }
  };

  const handleSend = () => {
    sendMutation.mutate();
  };

  const openPreview = (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    setPreviewItem(item);
  };

  if (isLoading || isLoadingMode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Content Library</h1>
            <p className="text-muted-foreground">Curated education modules for your patients.</p>
          </div>
          
          {selectedItems.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fixed bottom-6 right-6 sm:static z-50">
              {isPacketMode ? (
                <Button onClick={() => setIsPacketModalOpen(true)} size="lg" className="shadow-xl" data-testid="button-download-packet">
                  <Download className="w-4 h-4 mr-2" />
                  Create Packet ({selectedItems.length})
                </Button>
              ) : (
                <Button onClick={() => setIsSendModalOpen(true)} size="lg" className="shadow-xl" data-testid="button-send-items">
                  <Send className="w-4 h-4 mr-2" />
                  Send {selectedItems.length} Items
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or tag..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-filters">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedTags.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filter by Tag</h4>
                  {selectedTags.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs" data-testid="button-clear-filters">
                      Clear all
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {allTags.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tag-${tag}`} 
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTagFilter(tag)}
                          data-testid={`checkbox-tag-${tag}`}
                        />
                        <label 
                          htmlFor={`tag-${tag}`} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Active filter badges */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleTagFilter(tag)}
                  data-testid={`badge-filter-${tag}`}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredContent.length} of {contentItems.length} items
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border bg-card transition-all cursor-pointer hover:shadow-md",
                  isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                )}
              >
                {/* Selection Indicator */}
                <div className={cn(
                  "absolute top-3 right-3 z-10 w-6 h-6 rounded-full border border-white flex items-center justify-center transition-all",
                  isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-black/30 text-transparent group-hover:bg-white/80 group-hover:text-muted-foreground"
                )}>
                  <Check className="w-3.5 h-3.5" />
                </div>

                {/* Preview Button */}
                <button
                  onClick={(e) => openPreview(e, item)}
                  className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                  data-testid={`button-preview-${item.id}`}
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Image */}
                <div className="aspect-video overflow-hidden bg-muted relative">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {item.readTime || "5 min"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-serif font-bold text-lg leading-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="font-normal text-xs bg-secondary/50 text-secondary-foreground hover:bg-secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Send Modal */}
        <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Content to Patient</DialogTitle>
              <DialogDescription>
                You are sending {selectedItems.length} items. They will receive an email with secure links.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient-email">Patient Email</Label>
                <Input 
                  id="patient-email" 
                  placeholder="patient@example.com" 
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  data-testid="input-patient-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Personal Note (Optional)</Label>
                <Textarea 
                  id="note" 
                  placeholder="Hi James, here is the reading we discussed..." 
                  value={providerNote}
                  onChange={(e) => setProviderNote(e.target.value)}
                  data-testid="textarea-provider-note"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendModalOpen(false)} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSend} disabled={!patientEmail || sendMutation.isPending} data-testid="button-send">
                {sendMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Download Packet Modal (PHI-free mode) */}
        <Dialog open={isPacketModalOpen} onOpenChange={setIsPacketModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Content Packet
              </DialogTitle>
              <DialogDescription>
                Print or download {selectedItems.length} educational items as a patient handout.
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-96">
                <div ref={printRef} className="p-6 space-y-8 bg-white print:p-0" id="print-content">
                  <div className="text-center pb-4 border-b print:border-b-2">
                    <h1 className="text-2xl font-serif font-bold text-gray-900">Patient Education Materials</h1>
                    <p className="text-sm text-gray-600 mt-1">Prepared by your healthcare provider</p>
                  </div>
                  
                  {selectedItems.map((itemId, index) => {
                    const item = contentItems.find(c => c.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="page-break-inside-avoid">
                        <div className="border-b pb-6 mb-6 last:border-b-0">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded text-sm">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h2 className="text-xl font-serif font-bold text-gray-900">{item.title}</h2>
                              <p className="text-gray-600 mt-1">{item.summary}</p>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-700 pl-9">
                            {item.body.split('\n').map((paragraph, idx) => {
                              if (!paragraph.trim()) return null;
                              if (paragraph.startsWith('# ')) {
                                return <h3 key={idx} className="text-lg font-bold mt-4 mb-2">{paragraph.slice(2)}</h3>;
                              }
                              if (paragraph.startsWith('## ')) {
                                return <h4 key={idx} className="text-base font-semibold mt-3 mb-2">{paragraph.slice(3)}</h4>;
                              }
                              if (paragraph.startsWith('- ')) {
                                return <li key={idx} className="ml-4">{paragraph.slice(2)}</li>;
                              }
                              return <p key={idx} className="mb-2">{paragraph}</p>;
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="text-center pt-4 border-t text-sm text-gray-500 print:border-t-2">
                    <p>This educational content is provided for informational purposes only.</p>
                    <p>Please discuss any questions with your healthcare provider.</p>
                  </div>
                </div>
              </ScrollArea>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsPacketModalOpen(false)} data-testid="button-close-packet">
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const content = document.getElementById('print-content')?.innerHTML || '';
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Patient Education Materials</title>
                          <style>
                            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
                            h1 { font-size: 24px; margin-bottom: 8px; }
                            h2 { font-size: 20px; margin-top: 24px; }
                            h3 { font-size: 16px; margin-top: 16px; }
                            p { margin-bottom: 12px; line-height: 1.6; }
                            .border-b { border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 24px; }
                            @media print { body { padding: 20px; } }
                          </style>
                        </head>
                        <body>${content}</body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                data-testid="button-print-packet"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={() => {
                  const content = document.getElementById('print-content')?.innerText || '';
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'patient-education-materials.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast({
                    title: "Downloaded",
                    description: "Content packet saved to your device.",
                  });
                }}
                data-testid="button-download-txt"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Patient Preview Modal */}
        <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>Patient View Preview</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setPreviewItem(null)}
                  data-testid="button-close-preview"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {previewItem && (
              <ScrollArea className="max-h-[calc(90vh-80px)]">
                <div className="p-0">
                  {/* Hero Image */}
                  {previewItem.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={previewItem.imageUrl} 
                        alt={previewItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="px-8 py-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{previewItem.readTime || "5 min"} read</span>
                        <span>•</span>
                        <div className="flex gap-2">
                          {previewItem.tags.map(tag => (
                            <span key={tag} className="text-primary">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <h1 className="text-3xl font-serif font-bold">{previewItem.title}</h1>
                      <p className="text-lg text-muted-foreground">{previewItem.summary}</p>
                    </div>
                    
                    <hr className="border-border" />
                    
                    <div className="prose prose-slate max-w-none">
                      {previewItem.body.split('\n').map((paragraph, idx) => {
                        if (paragraph.startsWith('# ')) {
                          return <h1 key={idx} className="text-2xl font-serif font-bold mt-6 mb-4">{paragraph.slice(2)}</h1>;
                        }
                        if (paragraph.startsWith('## ')) {
                          return <h2 key={idx} className="text-xl font-serif font-bold mt-5 mb-3">{paragraph.slice(3)}</h2>;
                        }
                        if (paragraph.startsWith('### ')) {
                          return <h3 key={idx} className="text-lg font-serif font-bold mt-4 mb-2">{paragraph.slice(4)}</h3>;
                        }
                        if (paragraph.startsWith('- ')) {
                          return <li key={idx} className="ml-4">{paragraph.slice(2)}</li>;
                        }
                        if (paragraph.trim() === '') {
                          return <div key={idx} className="h-4" />;
                        }
                        return <p key={idx} className="mb-4 leading-relaxed">{paragraph}</p>;
                      })}
                    </div>
                    
                    <div className="pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground text-center">
                        This educational content was shared with you by your healthcare provider.
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
