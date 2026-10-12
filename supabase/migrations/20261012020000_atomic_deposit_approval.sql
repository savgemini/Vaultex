-- Track whether a deposit has already been credited to a user's balance.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS balance_credited_at timestamptz;

-- Existing settled deposits may already have been credited by the previous client-side flow.
UPDATE public.transactions
SET balance_credited_at = COALESCE(updated_at, created_at, now())
WHERE type = 'deposit'
  AND status IN ('completed', 'confirmed', 'approved')
  AND balance_credited_at IS NULL;

CREATE OR REPLACE FUNCTION public.admin_review_deposit(
  p_transaction_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deposit_row public.transactions%ROWTYPE;
  resolved_asset_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only platform admins can review deposits';
  END IF;

  IF p_status NOT IN ('completed', 'confirmed', 'approved', 'under_review', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported deposit status: %', p_status;
  END IF;

  SELECT *
  INTO deposit_row
  FROM public.transactions
  WHERE id = p_transaction_id
    AND type = 'deposit'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit transaction not found';
  END IF;

  IF deposit_row.balance_credited_at IS NOT NULL THEN
    IF p_status IN ('completed', 'confirmed', 'approved') THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'A credited deposit cannot be moved to status %', p_status;
  END IF;

  IF p_status IN ('completed', 'confirmed', 'approved') THEN
    IF deposit_row.status IN ('rejected', 'cancelled', 'expired') THEN
      RAISE EXCEPTION 'A % deposit cannot be approved', deposit_row.status;
    END IF;

    IF deposit_row.amount <= 0 THEN
      RAISE EXCEPTION 'Deposit amount must be greater than zero';
    END IF;

    resolved_asset_id := deposit_row.asset_id;
    IF resolved_asset_id IS NULL THEN
      SELECT id INTO resolved_asset_id
      FROM public.assets
      WHERE symbol = deposit_row.asset_symbol
        AND status = 'active'
      LIMIT 1;
    END IF;

    IF resolved_asset_id IS NULL THEN
      RAISE EXCEPTION 'Could not resolve an active asset for symbol %', deposit_row.asset_symbol;
    END IF;

    INSERT INTO public.balances (user_id, asset_id, available, invested, pending)
    VALUES (deposit_row.user_id, resolved_asset_id, deposit_row.amount, 0, 0)
    ON CONFLICT (user_id, asset_id)
    DO UPDATE SET
      available = public.balances.available + EXCLUDED.available,
      updated_at = now();

    UPDATE public.transactions
    SET status = 'completed',
        asset_id = resolved_asset_id,
        balance_credited_at = now(),
        updated_at = now()
    WHERE id = deposit_row.id;
  ELSE
    UPDATE public.transactions
    SET status = p_status,
        updated_at = now()
    WHERE id = deposit_row.id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_deposit(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_deposit(uuid, text) TO authenticated;