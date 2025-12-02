# XPLORE Tech News Voice Agent

This is a LiveKit voice agent that provides cutting-edge technology news using AI.

## Setup

1. **Create a virtual environment:**
   ```bash
   cd agent
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your credentials:
   - Get LiveKit credentials from [LiveKit Cloud](https://cloud.livekit.io)
   - Get OpenAI API key from [OpenAI](https://platform.openai.com)
   - (Optional) Get Deepgram API key from [Deepgram](https://deepgram.com) for better STT

4. **Run the agent:**
   ```bash
   python agent.py dev
   ```

## Features

- **Voice Activity Detection (VAD):** Uses Silero for accurate speech detection
- **Speech-to-Text:** Deepgram or OpenAI Whisper for transcription
- **LLM:** GPT-4o-mini for intelligent responses about tech news
- **Text-to-Speech:** OpenAI TTS with natural-sounding voice

## Topics Covered

- AI & Machine Learning (OpenAI, Google, Anthropic, Meta)
- Space Exploration (SpaceX, NASA, Blue Origin)
- Electric Vehicles & Autonomous Driving
- Smartphones & Gadgets
- Software & Apps
- Cybersecurity
- Startups & Tech Industry
- Scientific Breakthroughs

## Agent Commands

```bash
# Run in development mode (auto-reload)
python agent.py dev

# Run in production mode
python agent.py start

# Connect to a specific room
python agent.py dev --room my-room-name
```
