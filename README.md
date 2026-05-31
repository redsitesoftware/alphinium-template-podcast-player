# WaveForm

WaveForm is a multi-agent AI podcast player — a demo vehicle for [ChatInstance](https://chatinstance.com) by Alphinium. Listen to AI-hosted episodes and **interject live** mid-episode to ask the hosts anything.

## Features
- 8 AI-generated episodes on AI, startups, voice UI, remote work, and the singularity
- Real audio playback (`expo-av`) with transcript-driven karaoke display
- **Live Interject** — pause and chat with the AI hosts in real time
- Multi-agent personas (Maya, Leo, Ava) with distinct ElevenLabs TTS voices
- Content-relevant background images driven by current transcript line keywords
- Fullscreen image view with interject support
- End card with ChatInstance CTA when episode finishes
- Embedded ChatInstance widget (FAB) for episode discovery

## Live Deployments

| URL | Cluster | Notes |
|-----|---------|-------|
| `https://waveform.app.alphinium.com` | us-central1 user-pods (`alphinium-7r86kuat`) | Persistent user-pod — manually deployed via `build-and-deploy.sh` |
| `https://waveform.demo.alphinium.io` | australia-southeast1 alphinium-cluster (`alphinium-2hm4rxx6`) | Alphinium platform demo-pod — auto-built from `main` branch via `alphinium user-pods start demo-podcast` |

## Run locally
```bash
npm install --legacy-peer-deps
npx expo start --web --port 8101
```

## Deploy

### User-pod (waveform.app.alphinium.com)
```bash
./build-and-deploy.sh           # interactive, prompts for confirmation
./build-and-deploy.sh 20260531  # use a specific tag
```
Requires: `gcloud`, `docker buildx`, `kubectl` with context `gke_alphinium-production_us-central1-a_user-pods-cluster`.

### Demo-pod (waveform.demo.alphinium.io)
Managed by the Alphinium platform. Rebuilt from `main` automatically:
```bash
alphinium user-pods start demo-podcast   # triggers fresh build + deploy from main
alphinium user-pods list                 # check status
```
The demo-pod uses a separate image tag (`branch-main`) built by Alphinium CI/CD.

## Architecture
- **Frontend:** Expo React Native Web, deployed as a static site via nginx
- **Audio:** `expo-av` with real MP3 playback from Alphinium-hosted audio files
- **AI Interject:** ChatInstance WebSocket API (`CHATINSTANCE_WS_URL` in `src/config.js`)
- **TTS:** ElevenLabs voices per agent persona (configured in `AGENT_PERSONAS`)
- **Images:** LoremFlickr with keywords extracted from current transcript line
- **SEO:** Full OG/Twitter/JSON-LD meta, sitemap.xml, robots.txt, custom canonical

## Key files
| File | Purpose |
|------|---------|
| `src/config.js` | ChatInstance endpoint + agent IDs |
| `src/data/podcastData.js` | Episode data, agent personas, colors |
| `src/data/transcripts/` | Per-episode transcript arrays `[{t, speaker, text}]` |
| `src/hooks/useAudio.js` | Audio playback + `ended` state |
| `src/hooks/useTranscriptImage.js` | Content-relevant bg images from transcript keywords |
| `src/components/TranscriptView.js` | Main player card — karaoke, images, fullscreen, interject |
| `src/components/InterjectPanel.js` | Live chat overlay with agent selector |
| `src/components/EndCard.js` | End-of-episode ChatInstance CTA |
| `web/index.html` | SEO template (injected post-build by Dockerfile) |
| `Dockerfile` | Expo export + nginx, injects custom index.html |
