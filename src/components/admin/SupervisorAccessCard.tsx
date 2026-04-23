import { AlertTriangle, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProvisionSupervisorAccess, useSupervisorAccessCandidates } from '@/hooks/useAdmin';

export function SupervisorAccessCard() {
  const { data: candidates = [], isLoading } = useSupervisorAccessCandidates();
  const provisionAccess = useProvisionSupervisorAccess();

  const pendingCandidates = candidates.filter((candidate) => candidate.needs_account || candidate.needs_supervisor_role);

  const handleProvisionAll = async () => {
    for (const candidate of pendingCandidates) {
      // Keep provisioning sequential so each account stays easy to trace if a call fails.
      await provisionAccess.mutateAsync(candidate);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Supervisor Portal Access</CardTitle>
        <CardDescription>
          Create portal access for supervisors and keep their dashboards limited to assigned interns. Dennis stays on full admin access only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Scope</AlertTitle>
          <AlertDescription>
            Eligible supervisors are employees with assigned interns. `sottodennis@gmail.com` is intentionally excluded so the admin account remains unrestricted.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{candidates.length} supervisors found</Badge>
            <Badge variant="secondary">{pendingCandidates.length} need access updates</Badge>
          </div>
          <Button
            onClick={handleProvisionAll}
            disabled={pendingCandidates.length === 0 || provisionAccess.isPending}
            className="gap-2"
          >
            <UserRoundPlus className="h-4 w-4" />
            {provisionAccess.isPending ? 'Provisioning...' : 'Provision All Supervisors'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingCandidates.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            All supervisors already have the correct portal access.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCandidates.map((candidate) => (
              <div key={candidate.employee_id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {candidate.first_name} {candidate.last_name}
                    </p>
                    <Badge variant="outline">{candidate.assigned_intern_count} assigned intern{candidate.assigned_intern_count === 1 ? '' : 's'}</Badge>
                    {candidate.needs_account && (
                      <Badge variant="secondary">Needs account</Badge>
                    )}
                    {candidate.needs_supervisor_role && (
                      <Badge variant="secondary">Needs supervisor role</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  {candidate.job_title && (
                    <p className="text-xs text-muted-foreground">{candidate.job_title}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={provisionAccess.isPending}
                  onClick={() => provisionAccess.mutate(candidate)}
                >
                  <UserRoundPlus className="h-4 w-4" />
                  Enable Access
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-orange-200 bg-orange-50/60 px-4 py-3 text-sm text-orange-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              New supervisor accounts use the default portal password `654321` and receive the supervisor portal email when a brand-new auth account is created.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
