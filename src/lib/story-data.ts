"use client";

export type FieldType = "single" | "multi" | "rank";

export type FieldOption = {
  main: string;
  sub?: string;
  examples?: string[];
};

export type StoryField = {
  label: string;
  hint: string;
  type: FieldType;
  min?: number;
  max?: number;
  options: FieldOption[];
};

export type StoryKey = keyof typeof SB_FIELDS;

export type StoryAnswer = string | string[];
export type StoryAnswers = Record<string, StoryAnswer | undefined>;

export const STORY_KEYS = [
  "gender","age","relationship","region","dubaiTime","home","work","frequent","travel",
  "when","days","frequency","pace","career","worlds","drives","chemistry","values",
  "roomSize","energy","structure","formats","presence","avoids","intros","interests",
] as const;

export const READ_KEYS = [
  "need","archetype","chapter","professional_stance","own_chapter","contribution",
  "person_type","stage_moment","commercial_openness",
] as const;

export const PILL_KEYS = new Set([
  "gender","age","relationship","region","dubaiTime","days","frequency","values",
  "avoids","intros","interests","when","pace",
]);

export const FREETEXT_KEYS = new Set(["frequent"]);
export const HOME_ANOTHER = "Another neighbourhood";
export const HOME_ANOTHER_SUB = "My own corner of the city";
export const WORK_FROM_HOME = "From home";
export const WORK_FROM_HOME_SUB = "My space is my office";

export const SOCIAL_STANCES = [
  "here purely for my personal life",
  "keeping work mostly separate",
] as const;

export const SB_FIELDS = {
  "gender": {
    "label": "I'm a…",
    "hint": "Choose what feels right for your story.",
    "type": "single",
    "options": [
      {
        "main": "woman"
      },
      {
        "main": "man"
      },
      {
        "main": "non-binary person"
      },
      {
        "main": "prefer not to say"
      }
    ]
  },
  "age": {
    "label": "In my…",
    "hint": "Helps Philia create age-aware social settings.",
    "type": "single",
    "options": [
      {
        "main": "20s"
      },
      {
        "main": "30s"
      },
      {
        "main": "40s"
      },
      {
        "main": "50+"
      }
    ]
  },
  "relationship": {
    "label": "Relationship context",
    "hint": "Helps avoid awkward placement.",
    "type": "single",
    "options": [
      {
        "main": "single"
      },
      {
        "main": "partnered"
      },
      {
        "main": "married"
      },
      {
        "main": "separated"
      },
      {
        "main": "prefer not to say"
      }
    ]
  },
  "region": {
    "label": "Culturally connected to…",
    "hint": "Broad signal. Used lightly, not as a box.",
    "type": "single",
    "options": [
      {
        "main": "GCC"
      },
      {
        "main": "South Asia"
      },
      {
        "main": "Europe"
      },
      {
        "main": "East Asia"
      },
      {
        "main": "Africa"
      },
      {
        "main": "the Americas"
      },
      {
        "main": "Other"
      }
    ]
  },
  "dubaiTime": {
    "label": "I've been in Dubai for…",
    "hint": "Landing, settling, or rooting. The need changes.",
    "type": "single",
    "options": [
      {
        "main": "under 1 year"
      },
      {
        "main": "1–3 years"
      },
      {
        "main": "3–5 years"
      },
      {
        "main": "5+ years"
      },
      {
        "main": "I grew up here"
      }
    ]
  },
  "home": {
    "label": "I live around…",
    "hint": "Your primary neighbourhood",
    "type": "single",
    "options": []
  },
  "work": {
    "label": "I work mostly in…",
    "hint": "Where you spend most working hours",
    "type": "single",
    "options": []
  },
  "frequent": {
    "label": "I usually move around…",
    "hint": "Your most frequent area outside home/work",
    "type": "single",
    "options": [
      {
        "main": "DIFC",
        "sub": "Finance, fine dining, familiar faces"
      },
      {
        "main": "Downtown",
        "sub": "Urban, visible, always moving"
      },
      {
        "main": "Business Bay",
        "sub": "Ambitious, sleek, always-on"
      },
      {
        "main": "Dubai Marina",
        "sub": "Social, coastal, fast-moving"
      },
      {
        "main": "JLT",
        "sub": "Practical, eclectic, independent"
      },
      {
        "main": "Meydan",
        "sub": "Space, sport, new money energy"
      },
      {
        "main": "Dubai Hills",
        "sub": "Suburban quiet, slow pace"
      },
      {
        "main": "Jumeirah",
        "sub": "Residential, grounded, local"
      },
      {
        "main": "Al Quoz / Media City",
        "sub": "Creative, industrial, curious"
      },
      {
        "main": "Varies",
        "sub": "I follow the energy, not the place"
      }
    ]
  },
  "travel": {
    "label": "For the right setting, I'm…",
    "hint": "Keeps suggestions realistic.",
    "type": "single",
    "options": [
      {
        "main": "local only",
        "sub": "My neighbourhood, my comfort zone"
      },
      {
        "main": "open city-wide",
        "sub": "I go where the energy is"
      },
      {
        "main": "willing to travel",
        "sub": "Worth crossing the city for the right fit"
      },
      {
        "main": "depends on the format",
        "sub": "It depends what it is"
      }
    ]
  },
  "days": {
    "label": "I'm usually free on…",
    "hint": "Pick at least one, up to all five.",
    "type": "multi",
    "max": 5,
    "options": [
      {
        "main": "weeknights"
      },
      {
        "main": "Fridays"
      },
      {
        "main": "Saturdays"
      },
      {
        "main": "Sundays"
      },
      {
        "main": "flexibly"
      }
    ]
  },
  "frequency": {
    "label": "I can realistically show up…",
    "hint": "Keeps the network grounded in real life.",
    "type": "single",
    "options": [
      {
        "main": "once a month"
      },
      {
        "main": "twice a month"
      },
      {
        "main": "weekly"
      },
      {
        "main": "flexibly"
      }
    ]
  },
  "career": {
    "label": "Right now I'm…",
    "hint": "Practical context, not a personality label.",
    "type": "single",
    "options": [
      {
        "main": "early career",
        "sub": "Learning the landscape"
      },
      {
        "main": "building something",
        "sub": "Ventures, projects, creation"
      },
      {
        "main": "established",
        "sub": "Rooted, selective, intentional"
      },
      {
        "main": "transitioning",
        "sub": "Between chapters"
      },
      {
        "main": "creative",
        "sub": "Making, expressing, exploring"
      },
      {
        "main": "independent",
        "sub": "My own structure, my own pace"
      }
    ]
  },
  "worlds": {
    "label": "My world moves between…",
    "hint": "Pick at least 2, select as many as feel true.",
    "type": "multi",
    "min": 2,
    "max": 12,
    "options": [
      {
        "main": "finance and investment",
        "sub": "Markets, capital, enterprise"
      },
      {
        "main": "technology and product",
        "sub": "Building systems that scale"
      },
      {
        "main": "arts and culture",
        "sub": "Where beauty and meaning live"
      },
      {
        "main": "wellness and performance",
        "sub": "Body, mind, longevity"
      },
      {
        "main": "hospitality and lifestyle",
        "sub": "Experiences, taste, curation"
      },
      {
        "main": "law and policy",
        "sub": "Structure, power, governance"
      },
      {
        "main": "real estate",
        "sub": "Space, place, long-term thinking"
      },
      {
        "main": "medicine and health",
        "sub": "Science in service of life"
      },
      {
        "main": "education and ideas",
        "sub": "Knowledge as infrastructure"
      },
      {
        "main": "entrepreneurship",
        "sub": "Building from nothing"
      },
      {
        "main": "fashion and beauty",
        "sub": "Identity as aesthetic"
      },
      {
        "main": "social impact",
        "sub": "Systems that should be different"
      }
    ]
  },
  "roomSize": {
    "label": "I connect best in…",
    "hint": "Choose your centre of gravity.",
    "type": "rank",
    "max": 2,
    "options": [
      {
        "main": "1:1",
        "sub": "Deep focus on one person"
      },
      {
        "main": "intimate 2–4",
        "sub": "Small, trusted circle"
      },
      {
        "main": "small group 5–8",
        "sub": "Energy without noise"
      },
      {
        "main": "either",
        "sub": "I adapt to what's there"
      }
    ]
  },
  "energy": {
    "label": "Settings that feel…",
    "hint": "Primary and optional secondary.",
    "type": "rank",
    "max": 2,
    "options": [
      {
        "main": "calm and slow",
        "sub": "Depth over speed"
      },
      {
        "main": "warm and lively",
        "sub": "Connection with energy"
      },
      {
        "main": "high-energy and fast",
        "sub": "Moving rooms, fast bonds"
      }
    ]
  },
  "structure": {
    "label": "With…",
    "hint": "What helps you relax into connection?",
    "type": "rank",
    "max": 2,
    "options": [
      {
        "main": "guided structure",
        "sub": "I settle better with a framework"
      },
      {
        "main": "light hosting",
        "sub": "Some direction, lots of freedom"
      },
      {
        "main": "organic flow",
        "sub": "I find my way without scaffolding"
      }
    ]
  },
  "formats": {
    "label": "Especially through…",
    "hint": "Rank your top 3 formats.",
    "type": "rank",
    "max": 3,
    "options": [
      {
        "main": "dinner",
        "sub": "Table conversations, real ones"
      },
      {
        "main": "walks",
        "sub": "Movement unlocks honesty"
      },
      {
        "main": "coffee",
        "sub": "Low commitment, high possibility"
      },
      {
        "main": "cultural outings",
        "sub": "Shared experience, easy entry"
      },
      {
        "main": "shared activities",
        "sub": "Side by side, doing something"
      },
      {
        "main": "hosted salons",
        "sub": "Structured conversation"
      },
      {
        "main": "project-based rooms",
        "sub": "Building toward something together"
      }
    ]
  },
  "chemistry": {
    "label": "The people who feel right are…",
    "hint": "Pick 3 to 5. The qualities you feel most alive around.",
    "type": "multi",
    "min": 3,
    "max": 5,
    "options": [
      {
        "main": "intellectually curious",
        "sub": "The ones who read, question, synthesise"
      },
      {
        "main": "quietly ambitious",
        "sub": "Building extraordinary things without announcement"
      },
      {
        "main": "creatives and makers",
        "sub": "Artists, designers, builders of beautiful things"
      },
      {
        "main": "emotionally intelligent",
        "sub": "Who see beyond the surface, always"
      },
      {
        "main": "grounded and present",
        "sub": "Not performing. Just being."
      },
      {
        "main": "warm and generous",
        "sub": "Who give time and attention freely"
      }
    ]
  },
  "values": {
    "label": "I care most about people who value…",
    "hint": "Rank your top 3. Order matters.",
    "type": "rank",
    "max": 3,
    "options": [
      {
        "main": "honesty"
      },
      {
        "main": "depth"
      },
      {
        "main": "ambition"
      },
      {
        "main": "generosity"
      },
      {
        "main": "curiosity"
      },
      {
        "main": "emotional maturity"
      },
      {
        "main": "reliability"
      },
      {
        "main": "fun"
      }
    ]
  },
  "avoids": {
    "label": "What should Philia avoid for you?",
    "hint": "Settings and rooms to skip. Pick all that apply.",
    "type": "multi",
    "min": 1,
    "max": 8,
    "options": [
      {
        "main": "loud nightlife"
      },
      {
        "main": "transactional networking"
      },
      {
        "main": "dating-heavy rooms"
      },
      {
        "main": "business-heavy rooms"
      },
      {
        "main": "alcohol-centred plans"
      },
      {
        "main": "wellness-heavy rooms"
      },
      {
        "main": "anything too unstructured"
      },
      {
        "main": "anything too intense"
      }
    ]
  },
  "intros": {
    "label": "How do you prefer to be introduced?",
    "hint": "How Philia handles you. Pick what feels right.",
    "type": "multi",
    "min": 1,
    "max": 7,
    "options": [
      {
        "main": "no late-night first meets"
      },
      {
        "main": "public venues only for first meets"
      },
      {
        "main": "smaller first rooms only"
      },
      {
        "main": "soft introductions preferred"
      },
      {
        "main": "contact hidden until mutual"
      },
      {
        "main": "double opt-in only"
      },
      {
        "main": "quiet exit always OK"
      }
    ]
  },
  "interests": {
    "label": "Place me around people connected to…",
    "hint": "Pick up to 5.",
    "type": "multi",
    "max": 5,
    "options": [
      {
        "main": "wellness"
      },
      {
        "main": "culture"
      },
      {
        "main": "design"
      },
      {
        "main": "music"
      },
      {
        "main": "food"
      },
      {
        "main": "movement"
      },
      {
        "main": "spirituality"
      },
      {
        "main": "arts"
      },
      {
        "main": "learning"
      },
      {
        "main": "books"
      },
      {
        "main": "film"
      },
      {
        "main": "travel"
      },
      {
        "main": "outdoors"
      },
      {
        "main": "social impact"
      },
      {
        "main": "entrepreneurship"
      },
      {
        "main": "business"
      },
      {
        "main": "sport"
      },
      {
        "main": "fashion"
      }
    ]
  },
  "when": {
    "label": "When are you most alive?",
    "hint": "Your natural social window",
    "type": "single",
    "options": [
      {
        "main": "Early mornings",
        "sub": "Before the city wakes"
      },
      {
        "main": "Weekday evenings",
        "sub": "After hours, real conversations"
      },
      {
        "main": "Weekend afternoons",
        "sub": "Relaxed, exploratory, open"
      },
      {
        "main": "Late nights",
        "sub": "When defences are down"
      },
      {
        "main": "Spontaneously",
        "sub": "I move when it feels right"
      }
    ]
  },
  "pace": {
    "label": "What is your social pace?",
    "hint": "How you prefer to connect",
    "type": "single",
    "options": [
      {
        "main": "Slow and deep",
        "sub": "One real conversation over many light ones"
      },
      {
        "main": "Steady and selective",
        "sub": "Regular rituals with trusted people"
      },
      {
        "main": "Fast and varied",
        "sub": "I like novelty and high energy"
      },
      {
        "main": "Seasonal",
        "sub": "In waves, intense then quiet"
      }
    ]
  },
  "drives": {
    "label": "What drives you most?",
    "hint": "Rank your top 3 personal motivations.",
    "type": "rank",
    "max": 3,
    "options": [
      {
        "main": "Building something",
        "sub": "Ventures, projects, creation"
      },
      {
        "main": "Learning and expanding",
        "sub": "Ideas, domains, perspectives"
      },
      {
        "main": "Deep relationships",
        "sub": "Finding my true people"
      },
      {
        "main": "Physical excellence",
        "sub": "Health, performance, discipline"
      },
      {
        "main": "Financial independence",
        "sub": "Freedom through wealth"
      },
      {
        "main": "Creative expression",
        "sub": "Art, voice, aesthetics"
      },
      {
        "main": "Spiritual depth",
        "sub": "Meaning, purpose, presence"
      },
      {
        "main": "Influence and impact",
        "sub": "Moving things at scale"
      },
      {
        "main": "Adventure and novelty",
        "sub": "New places, new people, new risks"
      },
      {
        "main": "Recognition",
        "sub": "Being seen for what I actually do"
      },
      {
        "main": "Service",
        "sub": "Contributing to something larger"
      }
    ]
  },
  "presence": {
    "label": "What is your energy style?",
    "hint": "How you show up socially",
    "type": "single",
    "options": [
      {
        "main": "Introvert who performs extroversion",
        "sub": "I can hold a room, then I need to disappear"
      },
      {
        "main": "Natural extrovert",
        "sub": "People fuel me, always"
      },
      {
        "main": "Selective and quiet",
        "sub": "I save energy for people worth it"
      },
      {
        "main": "Chameleon",
        "sub": "I mirror and adapt without losing myself"
      },
      {
        "main": "Observer first",
        "sub": "I read the room before I enter it"
      }
    ]
  },
  "need": {
    "label": "What are you trying to grow?",
    "hint": "Rank at least 3. Your first pick is your lead signal.",
    "type": "rank",
    "min": 3,
    "max": 10,
    "options": [
      {
        "main": "Belonging",
        "sub": "Where do I feel at home?"
      },
      {
        "main": "Support",
        "sub": "Who can I lean on?"
      },
      {
        "main": "Rhythm",
        "sub": "What could become familiar?"
      },
      {
        "main": "Joy",
        "sub": "Who makes life lighter?"
      },
      {
        "main": "Growth",
        "sub": "Who helps me expand?"
      },
      {
        "main": "Depth",
        "sub": "Who can meet me honestly?"
      },
      {
        "main": "Discovery",
        "sub": "Who opens new worlds?"
      },
      {
        "main": "Opportunity",
        "sub": "Who expands what's possible?"
      },
      {
        "main": "Contribution",
        "sub": "Where can I give?"
      },
      {
        "main": "Partnership",
        "sub": "Who could build life with me?"
      }
    ]
  },
  "archetype": {
    "label": "Which archetypes fit you?",
    "hint": "Rank up to 3. Your first pick is your lead.",
    "type": "rank",
    "min": 1,
    "max": 3,
    "options": [
      {
        "main": "Anchor",
        "sub": "People feel steadier around you",
        "examples": [
          "The friend who calls at 2 AM",
          "Reliable enough that people restructure plans around you",
          "Still there, same number, same energy, 10 years later"
        ]
      },
      {
        "main": "Steward",
        "sub": "You protect and tend what matters",
        "examples": [
          "Remembers everyone's birthday and dietary restrictions",
          "Keeps the group chat alive when everyone else has gone quiet",
          "Organises the trip nobody else would bother planning"
        ]
      },
      {
        "main": "Confidant",
        "sub": "You hold what others cannot say aloud",
        "examples": [
          "Trusted with things people haven't said to anyone else",
          "Strangers open up to you on long flights",
          "The person who knows the version of people they don't show the world"
        ]
      },
      {
        "main": "Connector",
        "sub": "You bring the right people together",
        "examples": [
          "Introduces two people who end up becoming best friends",
          "Sees the thread between strangers before they do",
          "Your network is actually a web, not a list"
        ]
      },
      {
        "main": "Bridge",
        "sub": "You link worlds that don't usually meet",
        "examples": [
          "Equally at home in a boardroom and a basement party",
          "Translates between cultures without having to explain yourself",
          "Makes unlikely rooms feel natural"
        ]
      },
      {
        "main": "Builder",
        "sub": "You make things real",
        "examples": [
          "Always mid-project, always mid-sentence about it",
          "Turns dinner conversation into a business plan by dessert",
          "Gives people roles in something worth doing"
        ]
      },
      {
        "main": "Catalyst",
        "sub": "Things move differently when you arrive",
        "examples": [
          "Rooms shift in energy when you walk in",
          "People make decisions after talking to you that they'd been sitting on for months",
          "You accelerate what's already in motion"
        ]
      },
      {
        "main": "Explorer",
        "sub": "You go first and report back",
        "examples": [
          "First to discover the new neighbourhood, book, or person",
          "Reports back with enough detail that others can follow",
          "Always a beat ahead of what becomes mainstream"
        ]
      },
      {
        "main": "Curator",
        "sub": "You know what belongs and what doesn't",
        "examples": [
          "Your recommendations are trusted without question",
          "Taste runs through your playlist, apartment, and circle, all intentional",
          "People ask you before they commit to anything"
        ]
      },
      {
        "main": "Companion",
        "sub": "You show up, consistently, over time",
        "examples": [
          "Still texting 15 years later like no time passed",
          "Shows up without needing to be asked",
          "Consistency is the gift you give without thinking about it"
        ]
      },
      {
        "main": "Strategist",
        "sub": "You see the shape of things before others do",
        "examples": [
          "Quiet in groups, essential in the debrief after",
          "Sees the shape of situations before others have named the problem",
          "People bring you things they can't solve alone"
        ]
      },
      {
        "main": "Atmosphere-Setter",
        "sub": "Rooms change when you enter them",
        "examples": [
          "Dinners at yours feel different from dinners anywhere else",
          "You decide the energy before anyone arrives",
          "People want to be around you to feel something they can't name"
        ]
      }
    ]
  },
  "chapter": {
    "label": "Name this chapter",
    "hint": "Pick up to 3. Your first tap is your primary chapter.",
    "type": "rank",
    "min": 1,
    "max": 3,
    "options": [
      {
        "main": "The Pivot",
        "sub": "Changing direction with intention"
      },
      {
        "main": "The Build",
        "sub": "Creating something from nothing"
      },
      {
        "main": "The Arrival",
        "sub": "Landing somewhere that finally fits"
      },
      {
        "main": "The Deepening",
        "sub": "Going further into what already exists"
      },
      {
        "main": "The Search",
        "sub": "Not yet found, but actively looking"
      },
      {
        "main": "The Expansion",
        "sub": "Wider, bolder, more"
      },
      {
        "main": "The Return",
        "sub": "Coming back to something I left"
      },
      {
        "main": "The Unknown",
        "sub": "I do not have a name for it yet"
      }
    ]
  },
  "professional_stance": {
    "label": "How does your professional world sit here?",
    "hint": "Choose the option that fits honestly.",
    "type": "single",
    "options": [
      {
        "main": "here purely for my personal life"
      },
      {
        "main": "keeping work mostly separate"
      },
      {
        "main": "lightly open to professional overlap"
      },
      {
        "main": "an ambitious professional"
      },
      {
        "main": "an independent expert"
      },
      {
        "main": "a senior operator"
      },
      {
        "main": "a founder / business owner"
      },
      {
        "main": "an executive / C-suite"
      },
      {
        "main": "an investor / advisor"
      },
      {
        "main": "building something new"
      },
      {
        "main": "in transition"
      }
    ]
  },
  "own_chapter": {
    "label": "Where are you right now professionally?",
    "hint": "Your current mode.",
    "type": "single",
    "options": [
      {
        "main": "exploring a new direction"
      },
      {
        "main": "building the first version"
      },
      {
        "main": "preparing to launch"
      },
      {
        "main": "testing with early users"
      },
      {
        "main": "growing something"
      },
      {
        "main": "scaling something"
      },
      {
        "main": "repositioning"
      },
      {
        "main": "seeking clarity"
      },
      {
        "main": "expanding my network thoughtfully"
      },
      {
        "main": "entering founder mode"
      },
      {
        "main": "between chapters"
      }
    ]
  },
  "contribution": {
    "label": "What do you bring?",
    "hint": "Pick up to 3. The things you can genuinely offer.",
    "type": "multi",
    "min": 1,
    "max": 3,
    "options": [
      {
        "main": "strategic clarity"
      },
      {
        "main": "growth / marketing"
      },
      {
        "main": "brand and positioning"
      },
      {
        "main": "founder experience"
      },
      {
        "main": "fundraising perspective"
      },
      {
        "main": "hiring and team-building"
      },
      {
        "main": "product thinking"
      },
      {
        "main": "operations and systems"
      },
      {
        "main": "finance and commercial model"
      },
      {
        "main": "coaching / personal development"
      },
      {
        "main": "creative direction"
      },
      {
        "main": "community-building"
      },
      {
        "main": "warm introductions"
      },
      {
        "main": "investment perspective"
      },
      {
        "main": "venue / hosting access"
      },
      {
        "main": "market knowledge"
      },
      {
        "main": "accountability and follow-through"
      }
    ]
  },
  "person_type": {
    "label": "Who do you help best?",
    "hint": "Pick up to 3. Who your contribution lands with most naturally.",
    "type": "multi",
    "min": 1,
    "max": 3,
    "options": [
      {
        "main": "founders"
      },
      {
        "main": "independents"
      },
      {
        "main": "ambitious professionals"
      },
      {
        "main": "senior operators"
      },
      {
        "main": "women building something"
      },
      {
        "main": "creators"
      },
      {
        "main": "consultants"
      },
      {
        "main": "executives"
      },
      {
        "main": "people in transition"
      },
      {
        "main": "people entering founder mode"
      }
    ]
  },
  "stage_moment": {
    "label": "When are you most useful?",
    "hint": "The moment or stage where your help lands best.",
    "type": "single",
    "options": [
      {
        "main": "starting something"
      },
      {
        "main": "launching"
      },
      {
        "main": "looking for clarity"
      },
      {
        "main": "scaling"
      },
      {
        "main": "repositioning"
      },
      {
        "main": "fundraising"
      },
      {
        "main": "building a team"
      },
      {
        "main": "entering a new market"
      },
      {
        "main": "making a difficult decision"
      },
      {
        "main": "seeking accountability"
      },
      {
        "main": "exploring partnerships"
      },
      {
        "main": "turning expertise into a business"
      },
      {
        "main": "moving into leadership"
      }
    ]
  },
  "commercial_openness": {
    "label": "If it goes further…",
    "hint": "Pick up to 5. Your honest stance on where this could go.",
    "type": "multi",
    "min": 1,
    "max": 5,
    "options": [
      {
        "main": "happy to contribute with no agenda"
      },
      {
        "main": "open to useful exchange"
      },
      {
        "main": "open to collaboration"
      },
      {
        "main": "open to paid work if clearly invited"
      },
      {
        "main": "open to warm introductions"
      },
      {
        "main": "open to partnerships"
      },
      {
        "main": "exploring what may emerge"
      },
      {
        "main": "not open to commercial work here"
      }
    ]
  }
} satisfies Record<string, StoryField>;

export function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function isFilled(v: StoryAnswer | undefined) {
  return v != null && v !== "" && (!Array.isArray(v) || v.length > 0);
}

export function formatSbAnswer(answers: StoryAnswers, key: string) {
  const v = answers[key];
  if (!v) return "…";
  if (!Array.isArray(v)) return cap(v);
  if (v.length === 0) return "…";
  const join = (arr: string[]) =>
    arr.length === 1
      ? cap(arr[0])
      : arr.length === 2
        ? cap(arr[0]) + " and " + arr[1]
        : cap(arr[0]) + ", " + arr.slice(1, -1).join(", ") + ", and " + arr[arr.length - 1];
  if (key === "need") return cap(v[0]);
  if (key === "values") return cap(v.join(" › "));
  if (key === "formats") return v.length === 3 ? cap(v[0]) + ", " + v[1] + ", or " + v[2] : join(v);
  if (key === "roomSize") return v.length >= 2 ? cap(v[0]) + ", with openness to " + v[1] : cap(v[0]);
  if (key === "energy") return v.length >= 2 ? cap(v[0]) + ", with some " + v[1] : cap(v[0]);
  if (key === "structure") return v.length >= 2 ? cap(v[0]) + ", leaving room for " + v[1] : cap(v[0]);
  return join(v);
}

export type StorySection = {
  l: string;
  h: string;
  bg: string;
  keys: string[];
  catalystKeys?: string[];
  socialStances?: readonly string[];
};

export const STORY_SECTIONS: StorySection[] = [
  {
    l: "Identity",
    h: "Who you are, in context. Tap each blank to place yourself.",
    bg: "linear-gradient(160deg,#7A7060 0%,#A89E8C 45%,#C8BFB0 100%)",
    keys: ["gender","age","relationship","region","dubaiTime"],
  },
  {
    l: "Location",
    h: "Where your life in Dubai actually happens. Mark where you live, work, and actually move.",
    bg: "linear-gradient(160deg,#8C8070 0%,#B0A898 45%,#CFC8BC 100%)",
    keys: ["home","work","frequent","travel"],
  },
  {
    l: "Availability & Pace",
    h: "When you show up, and how. Set the times and pace you can really keep.",
    bg: "linear-gradient(160deg,#6E7060 0%,#9CA090 45%,#C4C8B8 100%)",
    keys: ["when","days","frequency","pace"],
  },
  {
    l: "Career & Drives",
    h: "What you're building, and why. Name the work, the worlds, and what pulls you.",
    bg: "linear-gradient(160deg,#706050 0%,#A09080 45%,#C8B8A8 100%)",
    keys: ["career","worlds","drives"],
  },
  {
    l: "People",
    h: "Who fits, and how you arrive. Choose who feels right, what you value, and how you show up.",
    bg: "linear-gradient(160deg,#707880 0%,#A0A8B0 45%,#C8D0D8 100%)",
    keys: ["chemistry","values","presence"],
  },
  {
    l: "Room",
    h: "The settings where you come alive. Describe the rooms that actually work for you.",
    bg: "linear-gradient(160deg,#606858 0%,#909888 45%,#B8C0B0 100%)",
    keys: ["roomSize","energy","structure","formats"],
  },
  {
    l: "Avoidances & Interests",
    h: "What Philia holds with discretion. Say what to avoid, how to introduce you, and who to place you near.",
    bg: "linear-gradient(160deg,#686060 0%,#989090 45%,#C0B8B8 100%)",
    keys: ["avoids","intros","interests"],
  },
];

export const READ_SECTIONS: StorySection[] = [
  {
    l: "Need",
    h: "What your social life is asking for right now. Fill the blank with the need, not a plan.",
    bg: "linear-gradient(160deg,#5E77FD 0%,#8B9FE0 45%,#C4CDF5 100%)",
    keys: ["need"],
  },
  {
    l: "Archetype",
    h: "How you naturally show up in a room. Choose the one that feels true when you walk in.",
    bg: "linear-gradient(160deg,#6A7898 0%,#9AAABB 45%,#C8D4DE 100%)",
    keys: ["archetype"],
  },
  {
    l: "Chapter",
    h: "The feeling of where you are right now. Name this chapter as it actually is.",
    bg: "linear-gradient(160deg,#8A7060 0%,#B09A88 45%,#D4C4B4 100%)",
    keys: ["chapter"],
  },
  {
    l: "What You Bring",
    h: "The part of your world that may create useful overlap. Say how work sits beside your social life.",
    bg: "linear-gradient(160deg,#5C4A2A 0%,#8B7245 45%,#C4A87A 100%)",
    keys: ["professional_stance"],
    catalystKeys: ["professional_stance","own_chapter","contribution","person_type","stage_moment","commercial_openness"],
    socialStances: SOCIAL_STANCES,
  },
];

export function storySentenceParts(idx: number): Array<string | { key: string }> {
  switch (idx) {
    case 0:
      return ["I'm a ", {key:"gender"}, " in my ", {key:"age"}, ", ", {key:"relationship"}, ", culturally connected to ", {key:"region"}, ", and I've been in Dubai for ", {key:"dubaiTime"}, "."];
    case 1:
      return ["I live around ", {key:"home"}, ", work mostly in ", {key:"work"}, ", and usually move around ", {key:"frequent"}, ". And I'm ", {key:"travel"}, " for the right social setting."];
    case 2:
      return ["Most alive ", {key:"when"}, ", usually free on ", {key:"days"}, ", and can realistically show up ", {key:"frequency"}, ". My social pace is ", {key:"pace"}, "."];
    case 3:
      return ["Right now I'm ", {key:"career"}, ", my world moves between ", {key:"worlds"}, ", and what drives me most is ", {key:"drives"}, "."];
    case 4:
      return ["The people who feel right are ", {key:"chemistry"}, ", and I care most about people who value ", {key:"values"}, ". I tend to show up as ", {key:"presence"}, " in social settings."];
    case 5:
      return ["I connect best in ", {key:"roomSize"}, " settings that feel ", {key:"energy"}, ", with ", {key:"structure"}, ", especially through ", {key:"formats"}, "."];
    case 6:
      return ["Please avoid ", {key:"avoids"}, ". When introducing me, ", {key:"intros"}, ". Place me around people connected to ", {key:"interests"}, "."];
    default:
      return [];
  }
}

export function readSentenceParts(idx: number, answers: StoryAnswers): Array<string | { key: string }> {
  if (idx === 0) return ["Right now, my social life is asking for ", {key:"need"}, "."];
  if (idx === 1) return ["At my core, I'm ", {key:"archetype"}, "."];
  if (idx === 2) return ["This chapter feels like ", {key:"chapter"}, "."];
  const stance = answers.professional_stance;
  if (!isFilled(stance)) return ["Professionally, I'm ", {key:"professional_stance"}, "."];
  return [
    "Professionally, I'm ", {key:"professional_stance"}, ", currently ", {key:"own_chapter"},
    ". Beyond being present, I bring ", {key:"contribution"}, ", most useful to ", {key:"person_type"},
    " who are ", {key:"stage_moment"}, ". If it goes further, I'm ", {key:"commercial_openness"}, ".",
  ];
}

export function isSocialStance(v: StoryAnswer | undefined) {
  return typeof v === "string" && (SOCIAL_STANCES as readonly string[]).includes(v);
}

export function sectionComplete(sec: StorySection, answers: StoryAnswers) {
  if (sec.catalystKeys) {
    const stance = answers.professional_stance;
    if (!isFilled(stance)) return false;
    if (isSocialStance(stance)) return true;
    return sec.catalystKeys.every((k) => isFilled(answers[k]));
  }
  return sec.keys.every((k) => isFilled(answers[k]));
}

export function firstIncomplete(sections: StorySection[], answers: StoryAnswers, from = 0, to = sections.length) {
  for (let i = from; i < to; i++) {
    if (!sectionComplete(sections[i], answers)) return i;
  }
  return null;
}

export function leadCap(v: StoryAnswer | undefined, fallback: string) {
  if (!v) return fallback;
  const s = Array.isArray(v) ? v[0] : v;
  return s ? cap(s) : fallback;
}
