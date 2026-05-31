# Going live

WaveForm is fully live with real audio playback, AI interject, TTS, and ChatInstance integration.

## Live deployments

| URL | How to update |
|-----|--------------|
| `https://waveform.app.alphinium.com` | `./build-and-deploy.sh` (manual docker build → k8s) |
| `https://waveform.demo.alphinium.io` | `alphinium user-pods start demo-podcast` (platform rebuilds from `main`) |

## What's implemented (complete)

- ✅ Real audio playback (`expo-av`) with seek, skip, speed control
- ✅ Transcript-driven karaoke view with word-by-word reveal
- ✅ Live Interject: ChatInstance WebSocket chat with agent personas
- ✅ Multi-agent personas — Maya, Leo, Ava with ElevenLabs TTS voices
- ✅ Content-relevant background images (keywords extracted from transcript line)
- ✅ Fullscreen image card with interject-safe exit
- ✅ End card with ChatInstance CTA on episode completion
- ✅ SEO — OG, Twitter Card, JSON-LD PodcastSeries + WebSite + SoftwareApplication
- ✅ sitemap.xml + robots.txt
- ✅ Embedded ChatInstance FAB widget on home screen

## Future enhancements

- #11 — Configurable image source for ChatInstance embed users
- #12 — Image-to-video MP4 export pipeline
