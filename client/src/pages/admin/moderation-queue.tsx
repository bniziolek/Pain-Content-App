
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { ContentItem } from "@shared/schema";

export function ModerationQueue() {
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: queue = [], isLoading } = useQuery<ContentItem[]>({
        queryKey: ["/api/admin/moderation/queue"],
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/moderation/${id}/approve`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to approve content");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Approved", description: "Content has been approved." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/queue"] });
            setSelectedContent(null);
            setIsPreviewDialogOpen(false);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const res = await fetch(`/api/admin/moderation/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) throw new Error("Failed to reject content");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Rejected", description: "Content has been returned for review." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/queue"] });
            setIsRejectDialogOpen(false);
            setRejectReason("");
            setSelectedContent(null);
            setIsPreviewDialogOpen(false);
        },
    });

    const handleReject = () => {
        if (selectedContent && rejectReason) {
            rejectMutation.mutate({ id: selectedContent.id, reason: rejectReason });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
                    <div className="text-sm text-muted-foreground">
                        {queue.length} items pending review
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Read Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Loading queue...
                                    </TableCell>
                                </TableRow>
                            ) : queue.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <Check className="mx-auto h-8 w-8 mb-2 text-green-500" />
                                        No content pending moderation. All caught up!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                queue.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{item.title}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {item.summary}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm">
                                                <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                                                {item.submittedAt ? format(new Date(item.submittedAt), "MMM d, yyyy") : "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.readTime}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                                {item.moderationStatus}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedContent(item);
                                                    setIsPreviewDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review Content</DialogTitle>
                        <DialogDescription>
                            Review the content below for quality and compliance.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedContent && (
                        <div className="space-y-6">
                            <div className="prose prose-sm max-w-none border rounded-lg p-6 bg-muted/20">
                                <h1>{selectedContent.title}</h1>
                                <p className="lead">{selectedContent.summary}</p>
                                <hr />
                                <div className="whitespace-pre-wrap">{selectedContent.body}</div>
                            </div>

                            <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                                <div className="flex space-x-4 text-sm">
                                    <span>
                                        <strong>Type:</strong> Educational
                                    </span>
                                    <span>
                                        <strong>Tags:</strong> {selectedContent.tags?.join(", ") || "None"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setIsRejectDialogOpen(true)}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Reject / Request Changes
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => selectedContent && approveMutation.mutate(selectedContent.id)}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Approve Content
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Reason Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Content</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This will be visible to the submitter.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        placeholder="e.g., References missing, incorrect formatting, clinical accuracy check needed..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
                            Reject Content
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
