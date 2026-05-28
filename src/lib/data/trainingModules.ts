import { TrainingModule } from "@/types";

export const trainingModules: TrainingModule[] = [
  // === BASICS ===
  {
    id: "sit",
    title: "Sit",
    description:
      "The foundation of all training. Teach your dog to sit on command reliably.",
    category: "basics",
    difficulty: "beginner",
    icon: "🪑",
    estimatedMinutes: 15,
    steps: [
      {
        id: "sit-1",
        title: "Lure with a treat",
        description:
          "Hold a treat close to your dog's nose and slowly move it upward over their head. As their head follows the treat, their bottom will naturally lower.",
        tipText:
          "Keep the treat close to the nose — if it's too high, they'll jump instead.",
        estimatedMinutes: 3,
      },
      {
        id: "sit-2",
        title: "Mark and reward",
        description:
          "The moment their bottom touches the ground, say 'Yes!' or click, then give the treat immediately.",
        tipText:
          "Timing is everything — mark the exact instant they sit, not after.",
        estimatedMinutes: 3,
      },
      {
        id: "sit-3",
        title: "Add the verbal cue",
        description:
          "Once your dog is reliably following the lure, start saying 'Sit' just before you lure. Repeat until they respond to the word alone.",
        tipText:
          "Say the cue once — repeating 'sit sit sit' teaches them to ignore it.",
        estimatedMinutes: 5,
      },
      {
        id: "sit-4",
        title: "Practice in different locations",
        description:
          "Practice in various rooms, outdoors, with mild distractions. Reward generously in new environments.",
        tipText:
          "New location = new challenge. Go back to treats even if they're reliable at home.",
        estimatedMinutes: 4,
      },
    ],
  },
  {
    id: "stay",
    title: "Stay",
    description:
      "Teach your dog to remain in position until released. Essential for safety.",
    category: "basics",
    difficulty: "beginner",
    icon: "✋",
    estimatedMinutes: 20,
    steps: [
      {
        id: "stay-1",
        title: "Start with duration",
        description:
          "Ask your dog to sit. Wait 1 second, mark 'Yes!', and reward. Gradually increase the time before marking.",
        tipText:
          "Start with just 1-2 seconds. Build up slowly — rushing creates a sloppy stay.",
        estimatedMinutes: 5,
      },
      {
        id: "stay-2",
        title: "Add a release word",
        description:
          "Choose a release word like 'Free!' or 'OK!'. Only reward after the release. Dog learns to hold position until they hear it.",
        tipText:
          "Don't use 'OK' if you say it a lot in conversation — pick something distinct.",
        estimatedMinutes: 4,
      },
      {
        id: "stay-3",
        title: "Add distance",
        description:
          "Take one step back, return immediately, mark and reward. Gradually increase steps away.",
        tipText:
          "If they break position, you moved too far too fast. Go back one level.",
        estimatedMinutes: 5,
      },
      {
        id: "stay-4",
        title: "Add mild distractions",
        description:
          "Practice with mild distractions: someone walking by, a toy on the ground. Reward heavily for holding position.",
        tipText:
          "Reduce distance when adding distractions. Only increase one challenge at a time.",
        estimatedMinutes: 6,
      },
    ],
  },
  {
    id: "recall",
    title: "Come (Recall)",
    description:
      "The most important safety command. Your dog comes to you reliably when called.",
    category: "basics",
    difficulty: "intermediate",
    icon: "🏃",
    estimatedMinutes: 25,
    steps: [
      {
        id: "recall-1",
        title: "Name game",
        description:
          "Say your dog's name. When they look at you, mark 'Yes!' and reward. Repeat until their name = instant attention.",
        tipText:
          "Never use their name for corrections — keep it always positive.",
        estimatedMinutes: 5,
      },
      {
        id: "recall-2",
        title: "Short-distance recall",
        description:
          "From 5 feet away, crouch down, say your dog's name + 'Come!', and encourage them with happy energy. Reward generously when they reach you.",
        tipText:
          "Make yourself exciting! Open arms, happy voice, high-value treats.",
        estimatedMinutes: 5,
      },
      {
        id: "recall-3",
        title: "Increase distance gradually",
        description:
          "Practice in a hallway or fenced area. Increase distance by 5 feet at a time. Always make coming to you the best thing ever.",
        tipText:
          "Use a long leash (15-30ft) outdoors for safety while training.",
        estimatedMinutes: 8,
      },
      {
        id: "recall-4",
        title: "Add distractions",
        description:
          "Practice with other dogs nearby, in parks, around squirrels. Start on a long leash and only go off-leash when 95% reliable.",
        tipText:
          "Never recall your dog to punish them or end fun — they'll stop coming.",
        estimatedMinutes: 7,
      },
    ],
  },

  // === MANNERS ===
  {
    id: "loose-leash",
    title: "Loose Leash Walking",
    description:
      "Walk nicely without pulling. Makes walks enjoyable for both of you.",
    category: "manners",
    difficulty: "intermediate",
    icon: "🦮",
    estimatedMinutes: 20,
    steps: [
      {
        id: "ll-1",
        title: "Reward the position",
        description:
          "Stand still. When your dog is beside you with the leash loose, mark and reward. They learn that position = treats.",
        tipText:
          "Reward at your leg, not above their head — you want them beside you.",
        estimatedMinutes: 5,
      },
      {
        id: "ll-2",
        title: "Stop when they pull",
        description:
          "Walk forward. The moment the leash goes tight, stop completely. Wait until they look back or return to your side, then continue.",
        tipText:
          "Be patient — the first walk might only go 20 feet. That's normal.",
        estimatedMinutes: 5,
      },
      {
        id: "ll-3",
        title: "Change direction",
        description:
          "When they forge ahead, turn 180° and walk the other way. Reward when they catch up to your side.",
        tipText:
          "Keep treats in the hand closest to your dog for quick rewards.",
        estimatedMinutes: 5,
      },
      {
        id: "ll-4",
        title: "Real-world practice",
        description:
          "Combine stopping and direction changes on regular walks. Gradually reduce treats as the behavior becomes habit.",
        tipText:
          "Some days will be harder (new smells, dogs nearby). That's OK — be patient.",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    id: "leave-it",
    title: "Leave It",
    description:
      "Your dog ignores tempting items on command. Critical for safety around toxic foods or trash.",
    category: "manners",
    difficulty: "intermediate",
    icon: "🚫",
    estimatedMinutes: 15,
    steps: [
      {
        id: "li-1",
        title: "Closed hand game",
        description:
          "Put a treat in your closed fist. Let your dog sniff, lick, paw. The moment they back away or look at your face, mark and reward with a DIFFERENT treat from your other hand.",
        tipText:
          "They never get the 'leave it' item — always reward from elsewhere.",
        estimatedMinutes: 4,
      },
      {
        id: "li-2",
        title: "Open hand",
        description:
          "Place a treat on your open palm. Say 'Leave it'. If they go for it, close your hand. When they look away, reward from the other hand.",
        tipText:
          "Cover the treat quickly if they lunge — don't let them self-reward.",
        estimatedMinutes: 4,
      },
      {
        id: "li-3",
        title: "Floor level",
        description:
          "Place a treat on the floor, cover with your hand. Say 'Leave it'. When they ignore it, reward from your other hand. Gradually lift your hand.",
        tipText:
          "Be ready to cover it again. Only lift your hand when they're reliably ignoring it.",
        estimatedMinutes: 4,
      },
      {
        id: "li-4",
        title: "Walking past items",
        description:
          "On walks, practice 'Leave it' with items on the ground. Start with low-value items and work up to food scraps.",
        tipText:
          "Keep them on leash during practice. Reward immediately when they ignore the item.",
        estimatedMinutes: 3,
      },
    ],
  },

  // === TRICKS ===
  {
    id: "shake",
    title: "Shake / Paw",
    description:
      "A fun, crowd-pleasing trick that's easy to teach and builds confidence.",
    category: "tricks",
    difficulty: "beginner",
    icon: "🤝",
    estimatedMinutes: 10,
    steps: [
      {
        id: "shake-1",
        title: "Encourage the paw lift",
        description:
          "Hold a treat in your closed fist near the ground. When they paw at your hand (they will!), mark and reward.",
        tipText:
          "Some dogs paw naturally, others need patience. Wait them out.",
        estimatedMinutes: 3,
      },
      {
        id: "shake-2",
        title: "Shape the behavior",
        description:
          "Present your open palm at their chest height. When they place their paw on it, mark and reward.",
        tipText: "Hold your hand low at first — shoulder height comes later.",
        estimatedMinutes: 3,
      },
      {
        id: "shake-3",
        title: "Add the cue",
        description:
          "Say 'Shake' or 'Paw' right before presenting your hand. After many reps, they'll respond to just the word.",
        tipText:
          "Gently wrap your fingers around their paw briefly — build up to actual handshake motion.",
        estimatedMinutes: 4,
      },
    ],
  },
  {
    id: "spin",
    title: "Spin",
    description:
      "Your dog spins in a circle. A fun trick that also helps with body awareness.",
    category: "tricks",
    difficulty: "beginner",
    icon: "🔄",
    estimatedMinutes: 10,
    steps: [
      {
        id: "spin-1",
        title: "Lure a full circle",
        description:
          "Hold a treat to your dog's nose and slowly lure them in a full circle. Mark and reward when they complete the turn.",
        tipText:
          "Go slowly — if they lose the lure, your hand is moving too fast.",
        estimatedMinutes: 3,
      },
      {
        id: "spin-2",
        title: "Fade the lure",
        description:
          "Make the hand motion bigger and the treat smaller. Use an empty hand to guide, then reward from the other hand.",
        tipText:
          "Gradually reduce the size of your hand circle over many repetitions.",
        estimatedMinutes: 3,
      },
      {
        id: "spin-3",
        title: "Add the verbal cue",
        description:
          "Say 'Spin' before making the hand signal. Eventually, the word alone will trigger the spin.",
        tipText: "Try both directions — some dogs have a preferred side!",
        estimatedMinutes: 4,
      },
    ],
  },

  // === SAFETY ===
  {
    id: "drop-it",
    title: "Drop It",
    description:
      "Your dog releases whatever is in their mouth. Essential for safety when they grab dangerous items.",
    category: "safety",
    difficulty: "intermediate",
    icon: "⬇️",
    estimatedMinutes: 15,
    steps: [
      {
        id: "drop-1",
        title: "Trade game",
        description:
          "Give your dog a low-value toy. Show them a high-value treat. When they release the toy to eat the treat, mark 'Yes!' and say 'Drop it'.",
        tipText:
          "Always trade UP in value — they should feel like they're getting a deal.",
        estimatedMinutes: 4,
      },
      {
        id: "drop-2",
        title: "Increase item value",
        description:
          "Gradually trade for items they value more: better toys, chews. Always trade for something even better.",
        tipText:
          "Never chase or force items from their mouth — this creates resource guarding.",
        estimatedMinutes: 4,
      },
      {
        id: "drop-3",
        title: "Return the item",
        description:
          "After they drop it, sometimes give the original item back! This teaches that dropping things doesn't mean losing them forever.",
        tipText:
          "Returning items builds trust and makes them more willing to drop things.",
        estimatedMinutes: 4,
      },
      {
        id: "drop-4",
        title: "Emergency practice",
        description:
          "Practice with items they shouldn't have (safe simulations). Say 'Drop it', reward heavily. Build reliability for real emergencies.",
        tipText:
          "Practice when calm — don't wait for a real emergency to test this.",
        estimatedMinutes: 3,
      },
    ],
  },

  // === SOCIAL ===
  {
    id: "greeting-people",
    title: "Polite Greetings",
    description:
      "Your dog greets people calmly without jumping. Great for visitors and public spaces.",
    category: "social",
    difficulty: "intermediate",
    icon: "👋",
    estimatedMinutes: 20,
    steps: [
      {
        id: "greet-1",
        title: "Four-on-the-floor",
        description:
          "Only pet/greet your dog when all four paws are on the ground. If they jump, turn away completely. Attention only comes when calm.",
        tipText:
          "Everyone in the household must be consistent — one person allowing jumps ruins it.",
        estimatedMinutes: 5,
      },
      {
        id: "greet-2",
        title: "Sit to greet",
        description:
          "Ask for a sit before petting. If they break the sit, remove your attention. Rebuild gradually.",
        tipText:
          "Keep initial greetings very brief — 3 seconds of petting, then stop.",
        estimatedMinutes: 5,
      },
      {
        id: "greet-3",
        title: "Practice with helpers",
        description:
          "Ask friends to help practice. They approach only when your dog is calm. If the dog gets excited, the person backs away.",
        tipText: "Give helpers treats to reward your dog for calm behavior.",
        estimatedMinutes: 5,
      },
      {
        id: "greet-4",
        title: "Real-world scenarios",
        description:
          "Practice at parks, pet stores, on walks. Carry treats and ask for a sit before anyone pets your dog.",
        tipText:
          "It's OK to tell people 'We're training, please wait until they sit'. Advocate for your dog.",
        estimatedMinutes: 5,
      },
    ],
  },
];

export function getModuleById(id: string): TrainingModule | undefined {
  return trainingModules.find((m) => m.id === id);
}

export function getModulesByCategory(category: string): TrainingModule[] {
  return trainingModules.filter((m) => m.category === category);
}
