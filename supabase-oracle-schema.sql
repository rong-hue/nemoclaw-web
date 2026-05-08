-- Oracle logs table: 记录每个用户每天的神谕生成
CREATE TABLE IF NOT EXISTS oracle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  image_url TEXT NOT NULL,
  oracle_text TEXT NOT NULL,
  oracle_text_en TEXT,
  seed TEXT NOT NULL,
  regenerate_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS policies
ALTER TABLE oracle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own oracle logs"
  ON oracle_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oracle logs"
  ON oracle_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oracle logs"
  ON oracle_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_oracle_logs_user_date ON oracle_logs(user_id, date);
