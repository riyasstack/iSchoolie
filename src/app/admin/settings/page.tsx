'use client';

import { Alert, Badge } from '@/components/ui/alert';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { isFirebaseConfigured, providerFlags, useFirebaseEmulators } from '@/lib/config';

export default function AdminSettingsPage() {
  const providers = [
    { name: 'Email & password', enabled: isFirebaseConfigured, note: 'Required provider' },
    { name: 'Google', enabled: isFirebaseConfigured, note: 'OAuth — configure in Firebase console' },
    { name: 'GitHub', enabled: isFirebaseConfigured, note: 'OAuth app — configure in Firebase console' },
    { name: 'Apple', enabled: providerFlags.apple, note: 'Hidden unless Apple credentials exist' },
    { name: 'LinkedIn', enabled: providerFlags.linkedin, note: 'Hidden unless an OIDC/LinkedIn app exists' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Platform settings"
        title="Runtime configuration"
        description="Read-only view of what this deployment is configured to do. Changes are made by operators, not from the browser."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Authentication providers" description="Only enabled providers render a button." />
          <CardBody>
            <ul className="divide-y divide-line">
              {providers.map((provider) => (
                <li key={provider.name} className="flex items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm text-ink">{provider.name}</p>
                    <p className="text-2xs text-subtle">{provider.note}</p>
                  </div>
                  <Badge tone={provider.enabled ? 'success' : 'neutral'}>
                    {provider.enabled ? 'available' : 'not configured'}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Environment" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-subtle">Firebase project configured</span>
              <Badge tone={isFirebaseConfigured ? 'success' : 'danger'}>
                {isFirebaseConfigured ? 'yes' : 'no'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subtle">Emulator suite</span>
              <Badge tone={useFirebaseEmulators ? 'warning' : 'neutral'}>
                {useFirebaseEmulators ? 'enabled' : 'off'}
              </Badge>
            </div>
            <Alert variant="warning" title="Spark plan guardrails">
              This build targets the no-cost Spark plan: no Cloud Functions, no Cloud Storage, no
              server-side rendering. Institution approval, verification and provisioning are
              performed by the local admin CLI. Moving to automated approvals requires Blaze —
              see docs/RUNBOOK.md.
            </Alert>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Operator runbook references" />
          <CardBody className="grid gap-2 text-xs text-subtle sm:grid-cols-2">
            <p>• Firestore read/write budgets: <span className="font-mono">docs/CAPACITY.md</span></p>
            <p>• Provider setup checklists: <span className="font-mono">docs/PROVIDERS.md</span></p>
            <p>• Deployment and approval workflow: <span className="font-mono">docs/RUNBOOK.md</span></p>
            <p>• Security model and rules split: <span className="font-mono">docs/SECURITY-MODEL.md</span></p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
