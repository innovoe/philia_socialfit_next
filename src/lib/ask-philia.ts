import raw from "@/lib/ask-data.json";

type AskPack = {
  KB: Record<string, string>;
  catIntro: Record<string, string>;
  catChips: Record<string, string[]>;
  related: Record<string, string[]>;
  issue: Record<string, string>;
};

const pack = raw as AskPack;

const EXTRA_KB: Record<string, string> = {
  "day in the life":
    "Imagine a Wednesday in Dubai.<br><br>You are between meetings in DIFC. Maybe not lonely, maybe just a little bored and aware...<br><br>You open SocialFit and send a Signal: something about wanting a slow dinner, thoughtful conversation, and creative energy. Nothing transactional. Just honest.<br><br>SocialFit moves through the trust graph and finds people in your Pod field whose Signals, Story, and Read suggest resonance. They see your Signal. Some respond.<br><br>You look through who came back and select the ones that feel right.<br><br>The moment you pick more than two, SocialFit turns it into a Room.<br><br>By evening, a Room shapes into reality based exactly on your Signal: a dinner for six in Jumeirah, formed around people whose Signals overlapped with yours. Someone is building something. Someone just moved here. Someone is in a chapter that feels like yours used to.<br><br>You do not know them yet. But the context was already right before you arrived.<br><br>That is what SocialFit is for. Not every night. Not forced. Just the right moment, with the right people, when you actually need it.",
  "what is a pod":
    "A Pod is your local SocialFit cluster.<br><br>Pods are based on where you live or spend time in Dubai, such as Meydan, Downtown, Marina, Jumeirah, DIFC, or other neighbourhood fields.<br><br>Your Pod helps SocialFit understand your nearby social world: who is around you, what people are signalling, what notes are appearing, and what Rooms may form close to you.<br><br>It is not a group chat. It is a geography-based social field.",
  "how are pods created":
    "Pods are formed around geography first.<br><br>SocialFit looks at where people live or spend time in Dubai, then clusters nearby members into local fields. As Signals and activity grow, each Pod begins to show its own rhythm: what people need, what they offer, what they are open to, and what Rooms could form nearby.",
  "what happens inside a pod":
    "Inside a Pod, you may see the social weather of your area: people nearby, live Signals, sticky notes, and Rooms beginning to form.<br><br>Pods help SocialFit turn geography into social possibility. They show what is happening around your part of the city, without turning it into a noisy group chat.",
  "what is a room":
    "A Room is where SocialFit becomes real.<br><br>It is a curated moment shaped around people, Signals, and fit: a dinner, walk, salon, game, founder circle, creative gathering, or hosted experience.<br><br>Some Rooms are created by SocialFit as branded or hosted experiences. Others can emerge from user Signals, when someone wants to do something and the system finds like-minded people nearby who resonate with that moment.<br><br>Pods gather the local field. Rooms bring it into the world.<br><br>It is a new way to find something to do with people who actually fit the mood, context, or intention behind it.",
  "is it awkward to go alone":
    "It can feel unfamiliar at first.<br><br>But Rooms are designed to remove friction. Small numbers, clear context, people who chose to be there for similar reasons. Most people who go once come back.",
  "can i bring a friend":
    "Not by default. Rooms are invitation-matched to protect the fit dynamic. If there is a specific situation, reach out and we can look at options.",
  "who hosts rooms":
    "Some Rooms are hosted by Philia directly. Others are hosted by members who have been given hosting access. All Rooms go through a curation process before they open.",
  "what are the plans":
    "Three tiers:<br><br><strong>Explorer</strong> — free. Your first read and entry into SocialFit.<br><br><strong>Insider</strong> — AED 50/mo annual or AED 79/mo flexible. Activates your Philia ID, Signals, and Rooms.<br><br><strong>Catalyst</strong> — AED 150/mo annual or AED 169/mo flexible. Priority routing, 20 Signals/mo, and the full SocialFit dashboard.",
  "what is explorer":
    "Explorer is free. You get your first social read, entry into SocialFit, and a feel for how the system works. It is where everyone starts.",
  "what is insider":
    "Insider is AED 50/mo (annual) or AED 79/mo flexible. It activates your Philia ID, lets you send live Signals, and connects you to Rooms happening in the city.<br><br>Month 1 is complimentary if 3 Keys have been claimed through you.",
  "what is catalyst":
    "Catalyst is AED 150/mo (annual) or AED 169/mo flexible. Priority routing, 20 Signals per month, advanced filters, and the full SocialFit dashboard. For people who want to actively shape their social life.",
  "what is first wave":
    "First Wave members lock in early-member status and pricing before the public launch. Access and pricing may change as SocialFit grows, but First Wave members keep their original terms.",
};

const KB: Record<string, string> = { ...pack.KB, ...EXTRA_KB };

const KEYWORD_MAP: Array<[RegExp, string]> = [
  [/what is this|what is socialfit|what is it|how does this work/, "what is this"],
  [/how is this different|what.s different|different from/, "how is this different"],
  [/dating|swipe|romance/, "is this dating"],
  [/invite.*only|why.*invite/, "why invite only"],
  [/what next|what do i do|next step|where am i|what should i do/, "what next"],
  [/claim.*key|my.*key.*not.*claimed/, "claim my key"],
  [/start.*signal|begin.*signal/, "start signal"],
  [/build.*story|start.*story/, "build story"],
  [/send.*key|sending.*key/, "send keys"],
  [/what happens.*launch|after.*launch|at.*launch/, "what happens at launch"],
  [/my key|what is.*key|what.*key/, "my key"],
  [/why.*i.*get.*key|why.*send.*key.*me|why did.*get/, "why did i get one"],
  [/why.*expire|key.*expire|expire/, "why do keys expire"],
  [/key.*expired|expired.*key/, "key expired"],
  [/send.*key|can.*send/, "can i send a key"],
  [/sent.*wrong|wrong.*person/, "i sent it wrong"],
  [/link.*broken|broken.*link|invite.*link/, "invite link broken"],
  [/my signal|what is.*signal|what.*signal/, "my signal"],
  [/example|show.*example|what.*write|what should.*write/, "show examples"],
  [/edit.*it|edit.*signal|change.*signal|can i.*edit/, "can i edit it"],
  [/who.*see.*it|who.*see.*signal/, "who sees it"],
  [/philia id|my.*id|what is.*id/, "philia id"],
  [/why.*locked|id.*locked|locked/, "why is it locked"],
  [/social mirror|mirror/, "what is social mirror"],
  [/others.*see|can.*others/, "can others see it"],
  [/self archetype|self.*archetype/, "what is self archetype"],
  [/social archetype/, "what is social archetype"],
  [/3 keys|three keys|why.*3|why.*three keys|why send/, "3 keys"],
  [/who.*choose|who.*pick|who.*nominate/, "who should i choose"],
  [/what.*they.*see|nominees.*see/, "what do they see"],
  [/don.t respond|not.*respond|no.*response/, "what if they don't respond"],
  [/change.*them|change.*someone|change.*nominee/, "can i change them"],
  [/remind/, "remind someone"],
  [/full privacy policy|privacy policy/, "full privacy policy"],
  [/privacy|private|is.*safe|my.*info/, "privacy"],
  [/who.*see.*answer|who.*see.*story/, "who sees my answers"],
  [/delete.*data|data.*delete/, "can i delete my data"],
  [/others.*see.*id|see.*my.*id/, "can others see my id"],
  [/otp|verify|verification|sms|phone.*code/, "what next"],
  [/day in the life|imagine a day|what does a day|example.*day|day.*socialfit/, "day in the life"],
  [/how.*pod.*creat|how.*pod.*form|pod.*creat/, "how are pods created"],
  [/what is a pod|what.*pod/, "what is a pod"],
  [/inside.*pod|what happens.*pod|pod.*inside/, "what happens inside a pod"],
  [/what is a room|what.*room/, "what is a room"],
];

export const CAT_LABELS: Record<string, string> = {
  whatis: "About SocialFit",
  whatnext: "What next?",
  mykey: "My Key",
  mysignal: "My Signal",
  philiaid: "Philia ID",
  threekeys: "3 Keys",
  privacy: "Privacy",
  stuck: "I'm stuck",
};

export const KB_TOPIC_LABELS: Record<string, string> = {
  pods: "Pods, Rooms & real life",
  plans: "Plans & membership",
};

export const KB_TOPIC_INTRO: Record<string, string> = {
  pods: "Pods are living clusters of compatible people. Rooms are real-world experiences curated from those clusters. What would you like to know?",
  plans: "Three tiers: Explorer (free), Insider (AED 50/mo annual), and Catalyst (AED 150/mo annual). What would you like to know?",
};

export const KB_TOPIC_CHIPS: Record<string, string[]> = {
  pods: [
    "What is a Pod?",
    "What happens inside a Pod?",
    "How are Pods created?",
    "What is a Room?",
    "Is it awkward to go alone?",
    "Can I bring a friend?",
  ],
  plans: [
    "What are the plans?",
    "What is Explorer?",
    "What is Insider?",
    "What is Catalyst?",
    "What is First Wave?",
  ],
};

export const FALLBACK_CHIPS = ["What is this?", "My Key", "My Signal", "I'm stuck"];
export const HOME_CHIPS = ["What next?", "My Key", "My Signal"];

export function normAsk(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function rewriteAskHtml(html: string) {
  return html.replace(/href=(["'])privacy\/\1/g, 'href="/privacy"');
}

export function kbAnswer(key: string) {
  return KB[key] ?? null;
}

export function lookupAsk(raw: string) {
  const q = normAsk(raw);
  if (KB[q]) return { key: q, html: KB[q] };
  for (const [re, key] of KEYWORD_MAP) {
    if (re.test(q) && KB[key]) return { key, html: KB[key] };
  }
  return null;
}

export function relatedChips(key: string) {
  return pack.related[key] || HOME_CHIPS;
}

export function categoryIntro(id: string) {
  return pack.catIntro[id] || "What would you like to know?";
}

export function categoryChips(id: string) {
  return pack.catChips[id] || [];
}

export function issueResolution(raw: string) {
  return pack.issue[normAsk(raw)] || null;
}

export type TicketState = null | "resolve" | "describe" | "email";

export function nextTicket(
  state: TicketState,
  raw: string,
): { html: string; state: TicketState; chips?: string[]; issue?: boolean } {
  const q = normAsk(raw);
  if (state === "resolve") {
    if (/fixed|thanks|sorted|worked/.test(q)) {
      return { html: "Glad that sorted it. Anything else?", state: null, chips: HOME_CHIPS };
    }
    return { html: "Tell us what happened in as much detail as you can.", state: "describe" };
  }
  if (state === "describe") {
    return { html: "Got it. What is the best email to reach you on?", state: "email" };
  }
  if (state === "email") {
    const ref = "PH-" + Math.floor(10000 + Math.random() * 90000);
    return {
      html: `Done. Ticket <strong>${ref}</strong> raised. The team will be in touch within 24 hours. Anything else?`,
      state: null,
      chips: HOME_CHIPS,
    };
  }
  const res = pack.issue[q];
  if (res) {
    return {
      html: res,
      state: "resolve",
      chips: ["That sorted it", "Still not working, raise a ticket"],
      issue: true,
    };
  }
  return { html: "Tell us what happened and Philia Support will review it.", state: "describe" };
}
