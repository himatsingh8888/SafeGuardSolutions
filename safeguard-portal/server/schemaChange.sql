
--already ran this 
ALTER TABLE public.employee ADD COLUMN IF NOT EXISTS password TEXT;

-- Set default password hash 
UPDATE public.employee
SET password = '$2b$10$H8OiUYO7NK3dv1Iov9eCauCrk/LVlGeU22uqX6saMYy0zUV8m.UAK'
WHERE password IS NULL;

CREATE TABLE IF NOT EXISTS public.client_auth (
  clientid  INTEGER PRIMARY KEY REFERENCES public.client(clientid) ON DELETE CASCADE,
  username  VARCHAR(50) UNIQUE NOT NULL,
  password  TEXT NOT NULL
);


--    John Smith  (clientid=1): username=johnsmith  password=John@2024!
--    Sarah Lee   (clientid=2): username=sarahlee   password=Sarah@2024!
INSERT INTO public.client_auth (clientid, username, password) VALUES
  (1, 'johnsmith', '$2b$10$4mEEjSMzME9bMiKV4hQn8ueOdfwnpHg01qCmhYK142oIGYs60F1pK'),
  (2, 'sarahlee',  '$2b$10$iFn23WvzVwYdAhz1/AzQquJCckdPoR1ESNUvYLmYe2o7QuPpEZkm6')
ON CONFLICT (clientid) DO NOTHING;
