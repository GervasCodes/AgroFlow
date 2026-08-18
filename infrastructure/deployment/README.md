Deployment notes per Section 27:
  WEB      -> static hosting / CDN
  API      -> cloud web service
  CHANNELS -> cloud web service, separate scaling profile (low-latency,
              session-driven, different traffic shape than the API)
  DATABASE -> managed PostgreSQL + PostGIS (e.g. Supabase, Neon)
  CACHE    -> managed Redis
  FILES    -> S3-compatible object storage
  MOBILE   -> Google Play + Apple App Store (+ direct APK for low-end
              Android where Play Store data cost is itself a barrier)
