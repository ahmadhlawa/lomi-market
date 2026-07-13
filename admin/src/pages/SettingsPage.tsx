import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useState } from 'react'

import { api, jsonBody } from '../api/client'
import { ErrorPanel, Loading, PageHeader } from '../components/ui'

type Setting = { key: string; value: Record<string, unknown>; description?: string; is_public: boolean }

export function SettingsPage() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['settings'], queryFn: () => api<Setting[]>('/admin/settings') })
  const [values, setValues] = useState<Record<string, string>>({})
  const save = useMutation({ mutationFn: ({ key, setting }: { key: string; setting: Setting }) => api(`/admin/settings/${key}`, { method: 'PUT', ...jsonBody({ value: JSON.parse(values[key] ?? JSON.stringify(setting.value)), description: setting.description, is_public: setting.is_public }) }), onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings'] }) })
  if (query.isLoading) return <Loading label="Loading settings" />
  if (query.isError) return <ErrorPanel error={query.error} retry={() => void query.refetch()} />
  return <><PageHeader title="Settings" description="Configuration stored centrally and consumed by customer and admin clients." /><div className="settings-grid">{query.data!.map((setting) => <article className="panel setting-card" key={setting.key}><header><div><h2>{setting.key.replaceAll('_', ' ')}</h2><p>{setting.description ?? (setting.is_public ? 'Visible to customer clients' : 'Internal configuration')}</p></div></header><textarea aria-label={`${setting.key} JSON`} value={values[setting.key] ?? JSON.stringify(setting.value, null, 2)} onChange={(e) => setValues((current) => ({ ...current, [setting.key]: e.target.value }))} spellCheck={false} /><button className="primary" onClick={() => save.mutate({ key: setting.key, setting })} disabled={save.isPending}><Save />Save {setting.key}</button></article>)}</div>{save.isError && <ErrorPanel error={save.error} />}</>
}
