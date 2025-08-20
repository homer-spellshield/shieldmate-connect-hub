import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, ShieldAlert } from "lucide-react";

interface SecurityScanAlertProps {
  issues: string[];
  criticalCount: number;
  onRunScan?: () => void;
}

export function SecurityScanAlert({ issues, criticalCount, onRunScan }: SecurityScanAlertProps) {
  if (issues.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-800">
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Status: Secure</AlertTitle>
        <AlertDescription>
          No security vulnerabilities detected in your application.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={criticalCount > 0 ? "border-red-200 bg-red-50 text-red-800" : "border-yellow-200 bg-yellow-50 text-yellow-800"}>
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>
        {criticalCount > 0 ? "Critical Security Issues Detected" : "Security Warnings"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Found {issues.length} security {issues.length === 1 ? 'issue' : 'issues'}
          {criticalCount > 0 && ` (${criticalCount} critical)`}
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {issues.slice(0, 3).map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
          {issues.length > 3 && (
            <li className="text-muted-foreground">...and {issues.length - 3} more</li>
          )}
        </ul>
        {onRunScan && (
          <button
            onClick={onRunScan}
            className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-background/50 hover:bg-background/80 transition-colors"
          >
            Run Security Scan
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}