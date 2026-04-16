import { useEffect, useState } from 'react'
import { isLabAvailable } from '../services/geminiClient'
import { generateRecoveryAudit, type AuditResult } from '../services/recoveryAuditorService'
import type { RecoveryLog, V11AppSettingsSchema, Workout } from '../db/schema'

type AuditStatus = 'idle' | 'loading' | 'result' | 'error'

interface RecoveryAuditState {
  status: AuditStatus
  hasLogs: boolean
  auditResult: AuditResult | null
  error: string | null
  isLabAvailable: boolean
}

export function useRecoveryAudit(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract?: V11AppSettingsSchema,
): RecoveryAuditState {
  const [status, setStatus] = useState<AuditStatus>('idle')
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const labAvailable = isLabAvailable()
  const hasLogs = logs.length > 0

  useEffect(() => {
    if (!hasLogs || !v11Contract || !labAvailable) {
      return
    }

    setStatus('loading')

    generateRecoveryAudit(logs, recentWorkouts, v11Contract)
      .then((result) => {
        setAuditResult(result)
        setStatus('result')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Audit failed')
        setStatus('error')
      })
  }, [hasLogs, labAvailable, v11Contract])

  return {
    status,
    hasLogs,
    auditResult,
    error,
    isLabAvailable: labAvailable,
  }
}
