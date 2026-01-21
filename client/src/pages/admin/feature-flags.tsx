import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2, Save, RotateCcw, History, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { FeatureFlag, AuditLog } from "@shared/api-types";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

type FlagChanges = Record<string, Partial<FeatureFlag>>;

interface HistoryDetails {
  action: string;
  flagKey: string;
  previousValue?: string;
  newValue?: string;
  previousEnabled?: boolean;
  isEnabled?: boolean;
  changedFields?: string[];
}

export default function AdminFeatureFlags() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [pendingChanges, setPendingChanges] = useState<FlagChanges>({});
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feature-flags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      return res.json() as Promise<FeatureFlag[]>;
    },
  });

  const { data: changeHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["feature-flags-history"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feature-flags/history/all", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json() as Promise<AuditLog[]>;
    },
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ key, updates }: { key: string; updates: Partial<FeatureFlag> }) => {
      const res = await fetch(`/api/admin/feature-flags/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update feature flag");
      return res.json();
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags-history"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast({
        title: "Feature Flag Updated",
        description: "The setting has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature flag.",
        variant: "destructive",
      });
    },
  });

  const getFlagWithChanges = (flag: FeatureFlag) => {
    const changes = pendingChanges[flag.key] || {};
    return { ...flag, ...changes };
  };

  const hasUnsavedChanges = (key: string) => {
    return Object.keys(pendingChanges[key] || {}).length > 0;
  };

  const updatePendingChange = (key: string, field: keyof FeatureFlag, value: unknown) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const revertChanges = (key: string) => {
    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const saveChanges = (key: string) => {
    const changes = pendingChanges[key];
    if (!changes) return;
    updateFlagMutation.mutate({ key, updates: changes });
  };

  const flagsByCategory = useMemo(() => {
    const grouped: Record<string, FeatureFlag[]> = {};
    featureFlags.forEach(flag => {
      const category = flag.category || 'general';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(flag);
    });
    return grouped;
  }, [featureFlags]);

  const categoryLabels: Record<string, string> = {
    general: "General Settings",
    content_delivery: "Content Delivery",
    compliance: "Compliance & Security",
    features: "Features",
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'compliance': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'content_delivery': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'features': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const historyByFlag = useMemo(() => {
    const grouped: Record<string, AuditLog[]> = {};
    changeHistory.forEach(log => {
      const details = log.details as HistoryDetails | null;
      if (details?.flagKey) {
        if (!grouped[details.flagKey]) grouped[details.flagKey] = [];
        grouped[details.flagKey].push(log);
      }
    });
    return grouped;
  }, [changeHistory]);

  if (flagsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="feature-flags-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feature Flags</h1>
            <p className="text-muted-foreground">Manage system-wide settings and feature toggles</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Settings2 className="h-3 w-3" />
            {featureFlags.length} flags configured
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(flagsByCategory).map(([category, flags]) => (
              <Card key={category} data-testid={`category-${category}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getCategoryBadgeColor(category)}>
                      {categoryLabels[category] || category}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flags.map(flag => {
                    const displayFlag = getFlagWithChanges(flag);
                    const hasChanges = hasUnsavedChanges(flag.key);
                    const flagHistory = historyByFlag[flag.key] || [];
                    const isExpanded = expandedFlag === flag.key;

                    return (
                      <div 
                        key={flag.key} 
                        className={`p-4 rounded-lg border transition-all ${hasChanges ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border'}`}
                        data-testid={`flag-${flag.key}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{displayFlag.name}</h3>
                              {displayFlag.isEnabled ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Enabled
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Disabled
                                </Badge>
                              )}
                              {hasChanges && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600">
                                  Unsaved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{displayFlag.description}</p>
                            <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                              {flag.key}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={displayFlag.isEnabled}
                              onCheckedChange={(checked) => updatePendingChange(flag.key, 'isEnabled', checked)}
                              data-testid={`toggle-${flag.key}`}
                            />
                          </div>
                        </div>

                        {displayFlag.value !== null && (
                          <div className="mt-4">
                            <Label className="text-sm">Value</Label>
                            <Input
                              value={displayFlag.value || ''}
                              onChange={(e) => updatePendingChange(flag.key, 'value', e.target.value)}
                              placeholder="Enter value..."
                              className="mt-1"
                              data-testid={`value-${flag.key}`}
                            />
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedFlag(isExpanded ? null : flag.key)}
                            className="text-muted-foreground"
                            data-testid={`history-toggle-${flag.key}`}
                          >
                            <History className="h-4 w-4 mr-1" />
                            {flagHistory.length} changes
                          </Button>

                          <div className="flex gap-2">
                            {hasChanges && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => revertChanges(flag.key)}
                                  data-testid={`revert-${flag.key}`}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Revert
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveChanges(flag.key)}
                                  disabled={updateFlagMutation.isPending}
                                  className="bg-teal-600 hover:bg-teal-700"
                                  data-testid={`save-${flag.key}`}
                                >
                                  {updateFlagMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 mr-1" />
                                  )}
                                  Save Changes
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {isExpanded && flagHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Change History</h4>
                            <ScrollArea className="h-[200px]">
                              <div className="space-y-2">
                                {flagHistory.map((log) => {
                                  const details = log.details as HistoryDetails | null;
                                  return (
                                    <div key={log.id} className="text-sm p-2 bg-muted/50 rounded">
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                                        <span>by {log.actorEmail || 'Unknown'}</span>
                                      </div>
                                      {details && (
                                        <div className="mt-1">
                                          {details.changedFields?.includes('isEnabled') && (
                                            <span className="text-xs">
                                              {details.previousEnabled ? 'Disabled' : 'Enabled'} → {details.isEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                          )}
                                          {details.changedFields?.includes('value') && (
                                            <span className="text-xs block">
                                              Value: "{details.previousValue || '(empty)'}" → "{details.newValue || '(empty)'}"
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Changes
                </CardTitle>
                <CardDescription>All feature flag modifications</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : changeHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No changes recorded yet</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {changeHistory.slice(0, 20).map((log) => {
                        const details = log.details as HistoryDetails | null;
                        return (
                          <div key={log.id} className="p-3 border rounded-lg" data-testid={`history-entry-${log.id}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {details?.flagKey}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              by {log.actorEmail || 'Unknown'}
                            </div>
                            {details?.changedFields && (
                              <div className="text-xs mt-2 text-muted-foreground">
                                Changed: {details.changedFields.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validation Status</CardTitle>
                <CardDescription>Feature flag configuration health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Flags</span>
                    <Badge variant="secondary">{featureFlags.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enabled</span>
                    <Badge className="bg-green-600">
                      {featureFlags.filter(f => f.isEnabled).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disabled</span>
                    <Badge variant="secondary">
                      {featureFlags.filter(f => !f.isEnabled).length}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Unsaved Changes</span>
                    <Badge variant={Object.keys(pendingChanges).length > 0 ? "destructive" : "secondary"}>
                      {Object.keys(pendingChanges).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
