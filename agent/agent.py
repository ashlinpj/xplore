import logging
from datetime import datetime
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, AgentServer
from livekit.plugins import silero
from livekit.plugins import groq

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tech-news-agent")

# System prompt for the AI assistant
SYSTEM_PROMPT = """You are XPLORE AI, an expert technology news assistant. Your role is to:

1. Provide the latest cutting-edge technology news and updates
2. Discuss topics like AI, machine learning, space exploration, robotics, electric vehicles, smartphones, software, cybersecurity, and emerging technologies
3. Give insightful analysis on tech trends and industry developments
4. Be conversational, engaging, and informative
5. When asked about specific news, provide recent and relevant information
6. If you don't have the latest information, acknowledge it and provide the most recent data you have

Keep responses concise but informative. Be enthusiastic about technology while remaining factual.
Current date: {current_date}

You can discuss:
- Latest AI developments (OpenAI, Google, Anthropic, Meta)
- Space news (SpaceX, NASA, Blue Origin)
- Electric vehicles and autonomous driving
- Smartphone and gadget releases
- Software and app updates
- Cybersecurity threats and solutions
- Startup news and tech industry moves
- Scientific breakthroughs

Important: Keep your responses short and conversational. No more than 2-3 sentences per response unless the user asks for more detail.
Do not use any special formatting, emojis, or symbols in your responses. Speak naturally as if having a conversation.
"""


class TechNewsAssistant(Agent):
    """Custom agent for tech news assistance"""
    
    def __init__(self):
        current_date = datetime.now().strftime("%B %d, %Y")
        system_prompt = SYSTEM_PROMPT.format(current_date=current_date)
        
        super().__init__(
            instructions=system_prompt,
        )


# Create the agent server
server = AgentServer()


@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    """Main entrypoint for the LiveKit agent"""
    
    logger.info(f"Connecting to room: {ctx.room.name}")
    
    # Create the agent session with STT, LLM, TTS pipeline
    # Using Groq for FREE LLM and LiveKit's built-in STT/TTS
    session = AgentSession(
        stt="deepgram/nova-3",  # LiveKit hosted STT (free)
        llm=groq.LLM(model="llama-3.3-70b-versatile"),  # Groq FREE
        tts="cartesia/sonic-2",  # LiveKit hosted TTS (free)
        vad=silero.VAD.load(),
    )
    
    # Start the session with our custom agent
    # Use RoomOptions (not deprecated RoomInputOptions)
    await session.start(
        room=ctx.room,
        agent=TechNewsAssistant(),
        room_options=agents.RoomOptions(
            audio_output=True,
            audio_input=True,
        ),
    )
    
    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the user warmly. Introduce yourself as XPLORE AI, their technology news assistant. "
        "Tell them you can help with the latest tech news about AI, space, electric vehicles, and more. "
        "Ask what they'd like to know about. Keep it brief, just 1-2 sentences."
    )
    
    logger.info("Agent session started")


if __name__ == "__main__":
    agents.cli.run_app(server)
