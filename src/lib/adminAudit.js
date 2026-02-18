import { supabase } from './supabase.js'

const normalizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {}
  }
  return metadata
}

export async function logAdminAction({
  actionType,
  targetType = 'system',
  targetId = null,
  summary = '',
  metadata = {},
}) {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user
    const role = user?.user_metadata?.role ?? 'customer'
    if (!user || role !== 'admin') return

    const payload = {
      admin_user_id: user.id,
      admin_email: user.email ?? '',
      action_type: actionType || 'unknown',
      target_type: targetType,
      target_id: targetId,
      summary,
      metadata: normalizeMetadata(metadata),
    }

    await supabase.from('admin_action_logs').insert(payload)
  } catch {
    // Audit logging must never block primary admin workflows.
  }
}

export async function fetchAdminActions(limit = 25) {
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  const role = user?.user_metadata?.role ?? 'customer'
  if (!user || role !== 'admin') {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('admin_action_logs')
    .select('id,admin_user_id,admin_email,action_type,target_type,target_id,summary,created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data: data ?? [], error }
}
