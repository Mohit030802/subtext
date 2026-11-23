-- Prevent the daily reminder job from emailing the same obligation more than once.
ALTER TABLE obligations
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_obligations_reminder_sent_at
    ON obligations (reminder_sent_at)
    WHERE reminder_sent_at IS NULL;
