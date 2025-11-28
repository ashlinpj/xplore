import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../models/Article.js';
import User from '../models/User.js';

dotenv.config();

const articles = [
  {
    title: "The Quantum Leap: Next-Gen Processors Are Here",
    excerpt: "Intel and AMD's latest chips promise a 40% performance boost in AI workloads.",
    content: `The semiconductor industry has reached a pivotal moment with the announcement of next-generation processors from both Intel and AMD. These new chips represent a quantum leap in computing capability, promising a staggering 40% performance improvement in AI-related workloads.

The technological advancement comes at a crucial time when artificial intelligence applications are becoming increasingly demanding. From machine learning model training to real-time inference, the new processors are designed to handle the computational heavy lifting that modern AI requires.

Industry analysts predict that these chips will accelerate the adoption of AI across various sectors, from healthcare to autonomous vehicles. The improved energy efficiency also addresses growing concerns about the environmental impact of data centers.

"This is not just an incremental improvement," said Dr. Sarah Chen, a semiconductor researcher at Stanford University. "We're looking at a fundamental shift in how we approach AI computing at the hardware level."

The chips are expected to hit the market in Q2 2025, with both consumer and enterprise-grade variants available.`,
    author: "Sarah Jenkins",
    category: "Hardware",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000",
    viewers: 1240,
    likes: 850,
    dislikes: 12,
    shares: 340,
    isLive: true
  },
  {
    title: "VR Revolution: Is This Finally The Year?",
    excerpt: "New lightweight headsets with 8K resolution are changing the game.",
    content: `Virtual reality technology has taken a significant leap forward with the introduction of a new generation of headsets that combine unprecedented visual fidelity with remarkable comfort and accessibility.

The latest VR headsets feature 8K resolution per eye, effectively eliminating the screen-door effect that has plagued previous generations. More importantly, manufacturers have achieved this without compromising on weight or battery life, addressing two of the most common complaints from VR enthusiasts.

The implications extend far beyond gaming. Industries from architecture to medical training are already exploring how these improved headsets can transform their workflows. Virtual collaboration spaces are becoming increasingly viable alternatives to physical meetings.

"We're finally at the point where VR can truly replace physical presence for many applications," noted Mike Ross, lead VR researcher at MIT's Media Lab. "The combination of visual quality, comfort, and affordability makes this a turning point."

Major tech companies are racing to capture market share, with new releases expected throughout the year.`,
    author: "Mike Ross",
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=1000",
    viewers: 890,
    likes: 420,
    dislikes: 45,
    shares: 120
  },
  {
    title: "Smart Cities: The Cyberpunk Reality",
    excerpt: "How IoT and AI are reshaping urban infrastructure in Tokyo and New York.",
    content: `The science fiction vision of interconnected smart cities is becoming reality as major metropolitan areas deploy sophisticated IoT networks and AI-driven management systems.

Tokyo and New York are leading the charge, implementing comprehensive sensor networks that monitor everything from traffic flow to air quality in real-time. These systems are powered by advanced AI algorithms that can predict and respond to urban challenges before they become problems.

In Tokyo, the system has reduced traffic congestion by 23% and improved emergency response times by 15%. New York has seen similar improvements in energy efficiency and waste management.

"We're essentially giving the city a nervous system," explained Akira Sato, Chief Technology Officer of Tokyo's Smart City Initiative. "The city can now sense, think, and respond to the needs of its citizens in ways that were impossible just five years ago."

Privacy advocates have raised concerns about the extensive data collection, prompting cities to implement strict governance frameworks and anonymization protocols.`,
    author: "Akira Sato",
    category: "Future Tech",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=1000",
    viewers: 2100,
    likes: 1500,
    dislikes: 20,
    shares: 890
  },
  {
    title: "SpaceX Launches Starship V3",
    excerpt: "The new reusable rocket aims for Mars within the decade.",
    content: `SpaceX has successfully launched the third generation of its Starship vehicle, marking another milestone in humanity's journey toward becoming a multi-planetary species.

The Starship V3 features significant improvements in payload capacity and fuel efficiency, making Mars missions economically viable for the first time. The fully reusable design reduces launch costs by an estimated 90% compared to traditional rockets.

The launch, witnessed by millions worldwide, demonstrated the vehicle's improved landing capabilities and rapid turnaround potential. SpaceX aims to achieve daily launches with the same vehicle within the next two years.

"Today we proved that Mars is not just a dream," said SpaceX in their official statement. "With Starship V3, we have the vehicle that will take humanity to the Red Planet."

The company has already begun accepting cargo reservations for their planned Mars missions in 2030.`,
    author: "Space Correspondent",
    category: "Space",
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&q=80&w=1000",
    viewers: 5600,
    likes: 4200,
    dislikes: 100,
    shares: 2100,
    isLive: true
  },
  {
    title: "AI Ethics: The Debate Continues",
    excerpt: "Global leaders meet to discuss the regulations of AGI development.",
    content: `World leaders and technology executives have gathered for an unprecedented summit on artificial general intelligence (AGI) regulation, seeking to establish international frameworks for the safe development of increasingly capable AI systems.

The summit, held in Geneva, brought together representatives from over 50 countries alongside leaders from major AI research labs. The discussions focused on establishing safety standards, defining red lines for AGI development, and creating mechanisms for international oversight.

Key points of contention included the pace of regulation, the role of open-source AI, and how to balance innovation with safety. Despite disagreements, participants expressed optimism about finding common ground.

"The technology is advancing faster than our ability to govern it," warned Dr. Chen, a leading AI ethics researcher. "We need frameworks that can evolve with the technology while protecting humanity from potential risks."

The summit is expected to produce a draft international agreement by the end of the year.`,
    author: "Dr. Chen",
    category: "AI",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000",
    viewers: 150,
    likes: 80,
    dislikes: 5,
    shares: 20
  },
  {
    title: "The Death of the Smartphone?",
    excerpt: "Why screenless AI pins and glasses might replace your phone by 2030.",
    content: `The smartphone as we know it may be living on borrowed time, according to industry analysts who see a fundamental shift in how we interact with technology on the horizon.

A new wave of wearable AI devices—from smart pins to AR glasses—is challenging the assumption that we need a screen in our pocket. These devices leverage advanced AI to provide information and services through voice, gestures, and ambient displays.

Early adopters report that after an adjustment period, they rarely miss their smartphones. The always-available AI assistant and context-aware notifications have proven more convenient than constantly pulling out a phone.

"The smartphone was a transitional technology," argues Jessica Lee, a consumer tech analyst. "It taught us to expect computing everywhere, but the form factor was always a compromise. We're now seeing what comes next."

Major tech companies are investing heavily in this space, with several mainstream devices expected to launch in 2025.`,
    author: "Jessica Lee",
    category: "Mobile",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
    viewers: 3200,
    likes: 2100,
    dislikes: 300,
    shares: 900
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xplore_technews');
    console.log('Connected to MongoDB');
    
    // Clear existing articles
    await Article.deleteMany({});
    console.log('Cleared existing articles');
    
    // Note: Admin users should be created manually in MongoDB
    // To make a user admin, update their role in the database:
    // db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
    
    // Insert new articles
    const createdArticles = await Article.insertMany(articles);
    console.log(`Inserted ${createdArticles.length} articles`);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
