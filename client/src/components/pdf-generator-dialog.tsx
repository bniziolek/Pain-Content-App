import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  title: string;
}

interface PDFGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentItems: ContentItem[];
}

interface PDFConfig {
  patientName: string;
  clinicianName: string;
  packetTitle: string;
  coverPageMessage: string;
  includeTableOfContents: boolean;
  pageSize: "letter" | "a4";
}

export function PDFGeneratorDialog({
  open,
  onOpenChange,
  contentItems,
}: PDFGeneratorDialogProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<PDFConfig>({
    patientName: "",
    clinicianName: user?.name || "",
    packetTitle: "Your Personalized Health Education",
    coverPageMessage: "",
    includeTableOfContents: false,
    pageSize: "letter",
  });

  const generatePDFMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/content/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contentIds: contentItems.map((item) => item.id),
          ...config,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "patient-education.pdf";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return filename;
    },
    onSuccess: (filename) => {
      toast.success(`PDF downloaded: ${filename}`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to generate PDF. Please try again.");
    },
  });

  const messageLength = config.coverPageMessage.length;
  const maxMessageLength = 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Generate PDF Packet
          </DialogTitle>
          <DialogDescription>
            Configure your content packet cover page. {contentItems.length}{" "}
            item{contentItems.length !== 1 ? "s" : ""} will be included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name (optional)</Label>
            <Input
              id="patientName"
              data-testid="input-patient-name"
              placeholder="Enter patient name"
              value={config.patientName}
              onChange={(e) =>
                setConfig({ ...config, patientName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicianName">Your Name</Label>
            <Input
              id="clinicianName"
              data-testid="input-clinician-name"
              placeholder="Your name"
              value={config.clinicianName}
              onChange={(e) =>
                setConfig({ ...config, clinicianName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packetTitle">Packet Title</Label>
            <Input
              id="packetTitle"
              data-testid="input-packet-title"
              placeholder="Your Personalized Health Education"
              value={config.packetTitle}
              onChange={(e) =>
                setConfig({ ...config, packetTitle: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="coverPageMessage">
                Personal Message (optional)
              </Label>
              <span
                className={`text-xs ${messageLength > maxMessageLength ? "text-destructive" : "text-muted-foreground"}`}
              >
                {messageLength}/{maxMessageLength}
              </span>
            </div>
            <Textarea
              id="coverPageMessage"
              data-testid="textarea-cover-message"
              placeholder="Add a personal note to your patient..."
              className="min-h-[80px]"
              value={config.coverPageMessage}
              onChange={(e) =>
                setConfig({ ...config, coverPageMessage: e.target.value })
              }
              maxLength={maxMessageLength}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="includeTableOfContents">
              Include Table of Contents
            </Label>
            <Switch
              id="includeTableOfContents"
              data-testid="switch-toc"
              checked={config.includeTableOfContents}
              onCheckedChange={(checked) =>
                setConfig({ ...config, includeTableOfContents: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pageSize">Page Size</Label>
            <Select
              value={config.pageSize}
              onValueChange={(value: "letter" | "a4") =>
                setConfig({ ...config, pageSize: value })
              }
            >
              <SelectTrigger id="pageSize" data-testid="select-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">Letter (8.5 x 11 in)</SelectItem>
                <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">Cover Page Preview</h4>
            <div className="text-center text-sm space-y-1">
              <p className="text-primary font-semibold">DriverPath</p>
              <p className="font-medium">{config.packetTitle || "Your Personalized Health Education"}</p>
              {config.patientName && (
                <p className="text-muted-foreground">
                  Prepared for: <strong>{config.patientName}</strong>
                </p>
              )}
              {config.clinicianName && (
                <p className="text-muted-foreground">
                  Curated by: <strong>{config.clinicianName}</strong>
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                {contentItems.length} educational resource{contentItems.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={() => generatePDFMutation.mutate()}
            disabled={
              generatePDFMutation.isPending ||
              contentItems.length === 0 ||
              messageLength > maxMessageLength
            }
            data-testid="button-generate-pdf"
          >
            {generatePDFMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
