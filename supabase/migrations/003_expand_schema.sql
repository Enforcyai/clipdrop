-- =============================================
-- Migration 003: Expand schema for ClipDrop
-- =============================================

-- 1. Add credits_balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_balance INT DEFAULT 5;

-- 2. Expand generations table
ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_mode_check;

ALTER TABLE public.generations
  ADD CONSTRAINT generations_mode_check
  CHECK (mode IN ('recorded', 'text2video', 'image2video', 'video2video'));

ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS input_asset_url TEXT;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS provider_job_id TEXT;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  preview_url TEXT,
  default_settings JSONB DEFAULT '{}',
  prompt_suggestions TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Posts table (published feed items)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 6. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Events table (analytics)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FK from generations.template_id -> templates.id
ALTER TABLE public.generations
  ADD CONSTRAINT fk_generations_template
  FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Templates: public read
CREATE POLICY "Templates are viewable by everyone"
  ON public.templates FOR SELECT USING (true);

-- Posts: public read (non-private authors)
CREATE POLICY "Published posts are viewable"
  ON public.posts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = posts.user_id
      AND profiles.is_private = false
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes: auth create, own delete
CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view likes"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can remove their own like"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: auth create, own delete
CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Events: users can insert
CREATE POLICY "Users can insert events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- Seed Templates
-- =============================================

INSERT INTO public.templates (name, description, category, tags, preview_url, default_settings, prompt_suggestions, is_featured) VALUES
  ('Hip Hop Freestyle', 'Dynamic hip hop dance moves with urban vibes', 'Dance', ARRAY['dance','hiphop','urban','freestyle'], '/templates/hiphop.png', '{"duration": 10, "style": "Realistic", "intensity": "high"}', ARRAY['A dancer doing hip hop freestyle in a city street','Hip hop dancer with neon lights background','Urban dance battle scene with dramatic lighting'], true),
  ('Ballet Grace', 'Elegant ballet movements with flowing motion', 'Dance', ARRAY['dance','ballet','elegant','classical'], '/templates/ballet.png', '{"duration": 8, "style": "Realistic", "intensity": "medium"}', ARRAY['A ballerina performing an arabesque on stage','Graceful ballet dancer in a moonlit studio','Classical ballet solo with flowing dress'], true),
  ('Smooth Transition', 'Seamless transitions between scenes', 'Transitions', ARRAY['transition','smooth','morph','edit'], '/templates/transition.png', '{"duration": 5, "style": "Realistic", "intensity": "medium"}', ARRAY['Person walking through a door into a different world','Smooth morph transition from day to night','Seamless outfit change transition effect'], true),
  ('Anime Hero', 'Anime-style character poses and actions', 'Anime', ARRAY['anime','hero','action','manga'], '/templates/anime.png', '{"duration": 8, "style": "Anime", "intensity": "high"}', ARRAY['Anime character doing a power-up transformation','Manga-style action sequence with speed lines','Anime hero landing pose with dramatic wind'], true),
  ('Cyberpunk City', 'Futuristic neon-lit cyberpunk aesthetics', 'Cyber', ARRAY['cyber','neon','futuristic','tech'], '/templates/cyber.png', '{"duration": 10, "style": "Neon", "intensity": "high"}', ARRAY['Cyberpunk character walking through neon city streets','Futuristic dance in a holographic nightclub','Neon-lit robot dance sequence'], true),
  ('Funny Meme Dance', 'Viral meme-worthy dance moves and expressions', 'Funny', ARRAY['funny','meme','viral','comedy'], '/templates/funny.png', '{"duration": 5, "style": "Cartoon", "intensity": "high"}', ARRAY['Person doing an exaggerated happy dance','Funny cat-like dance moves','Over-the-top victory celebration dance'], true),
  ('Retro 80s Groove', '80s-inspired dance with retro visuals', 'Retro', ARRAY['retro','80s','disco','vintage'], '/templates/retro.png', '{"duration": 10, "style": "Vintage", "intensity": "medium"}', ARRAY['80s disco dancer under a mirror ball','Retro roller skating dance with neon colors','Vintage breakdance battle in an arcade'], true),
  ('K-Pop Choreo', 'K-Pop inspired synchronized choreography', 'Dance', ARRAY['dance','kpop','choreo','sync'], '/templates/kpop.png', '{"duration": 15, "style": "Realistic", "intensity": "high"}', ARRAY['K-Pop group performing synchronized choreography','Solo K-Pop dance cover in a practice room','K-Pop style dance with colorful stage lighting'], true),
  ('Glitch Effect', 'Digital glitch and distortion transitions', 'Transitions', ARRAY['transition','glitch','digital','effect'], '/templates/glitch.png', '{"duration": 5, "style": "Neon", "intensity": "high"}', ARRAY['Person glitching between two locations','Digital distortion transformation effect','Matrix-style glitch dance sequence'], false),
  ('Anime Magic Girl', 'Magical girl transformation sequence', 'Anime', ARRAY['anime','magic','transformation','sparkle'], '/templates/magic.png', '{"duration": 8, "style": "Anime", "intensity": "medium"}', ARRAY['Magical girl transformation with sparkle effects','Anime-style spell casting with colorful aura','Fairy-tale character flying through clouds'], false),
  ('Robot Dance', 'Mechanical robotic dance movements', 'Cyber', ARRAY['cyber','robot','mechanical','dance'], '/templates/robot.png', '{"duration": 10, "style": "Realistic", "intensity": "medium"}', ARRAY['Robot doing precise mechanical dance moves','Android dancing in a futuristic lab','Steampunk robot waltz with gears and steam'], false),
  ('Vintage Film', 'Old film grain and classic cinema style', 'Retro', ARRAY['retro','vintage','film','cinema'], '/templates/vintage.png', '{"duration": 8, "style": "Vintage", "intensity": "low"}', ARRAY['Silent film era dance performance','Classic Hollywood musical number','Vintage swing dance with film grain effect'], false);
