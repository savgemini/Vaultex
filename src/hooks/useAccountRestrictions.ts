import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RestrictionType } from '@/types';

interface RestrictionRow {
  restriction_type: RestrictionType;
  expires_at: string | null;
}

export function useAccountRestrictions() {
  const { session, profile } = useAuth();
  const [restrictions, setRestrictions] = useState<RestrictionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadRestrictions = async () => {
      if (!session?.user?.id) {
        setRestrictions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('account_restrictions')
        .select('restriction_type, expires_at')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (queryError) {
        setError(true);
        setLoading(false);
        return;
      }

      const now = Date.now();
      setRestrictions(((data || []) as RestrictionRow[])
        .filter(row => !row.expires_at || new Date(row.expires_at).getTime() > now)
        .map(row => row.restriction_type));
      setError(false);
      setLoading(false);
    };

    loadRestrictions();
  }, [session?.user?.id]);

  const hasRestriction = (restriction: RestrictionType) =>
    restrictions.includes(restriction) || restrictions.includes('full_suspension') || profile?.account_status === 'suspended';

  return { restrictions, loading, error, hasRestriction };
}
