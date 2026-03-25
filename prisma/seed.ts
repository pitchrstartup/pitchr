import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectSeed = [
  {
    name: "FeePilot",
    tagline: "Live fee analytics for Bags token ecosystems",
    description:
      "FeePilot tracks swap fees, treasury capture, and holder distributions across Bags-linked pools. Teams get a clear breakdown of where value is generated and who captures it in real time.",
    twitterUrl: "https://twitter.com/feepilot",
    websiteUrl: "https://feepilot.app",
    tokenMint: "7S9f4Aq2mB1uZK8jL5wX9rE2nP6cV3tH1yD4gM8k",
    builderName: "Kira Lane",
  },
  {
    name: "WalletSignal",
    tagline: "Reputation scoring for every Solana wallet",
    description:
      "WalletSignal builds a transparent score from wallet behavior, long-term holding patterns, and protocol participation. Communities can use it for anti-sybil filtering and contribution-based rewards.",
    twitterUrl: "https://twitter.com/walletsignal",
    websiteUrl: "https://walletsignal.xyz",
    tokenMint: null,
    builderName: "Marco Sol",
  },
  {
    name: "GateForge",
    tagline: "Token-gated communities with Bags-native rules",
    description:
      "GateForge lets creators configure membership gates with Bags holdings, NFT traits, or staking proofs. It syncs roles to Discord and Telegram with instant wallet verification.",
    twitterUrl: "https://twitter.com/gateforge",
    websiteUrl: "https://gateforge.io",
    tokenMint: "A8t6Qw3Lp9Dn5Vb2Kr4Mx1Zs7Yh0Nc8Fp6Ue3Rj1",
    builderName: "Nina Park",
  },
  {
    name: "SplitWave",
    tagline: "Trading bot with built-in holder revenue share",
    description:
      "SplitWave runs automated strategies on Solana DEXs and allocates a share of realized fees to token holders. Builders can deploy templates or tune risk controls from a mobile-first dashboard.",
    twitterUrl: "https://twitter.com/splitwave",
    websiteUrl: "https://splitwave.finance",
    tokenMint: "Q4m2Lb8Ty1Hr6Cv9Np3Xs5Fk0Zd7Va2Me8Jw4Gh6",
    builderName: "Theo Mint",
  },
  {
    name: "CreatorPulse",
    tagline: "Revenue intelligence for on-chain creators",
    description:
      "CreatorPulse combines royalties, Bags incentives, and subscription payments into one timeline. Creators can benchmark growth, track campaign ROI, and export accounting-ready reports.",
    twitterUrl: "https://twitter.com/creatorpulse",
    websiteUrl: "https://creatorpulse.so",
    tokenMint: null,
    builderName: "Ari Bloom",
  },
  {
    name: "TreasuryDock",
    tagline: "Lightweight treasury ops for small Solana teams",
    description:
      "TreasuryDock simplifies treasury workflows with policy limits, scheduled payouts, and clear audit logs. It is optimized for teams shipping fast during hackathons and early launches.",
    twitterUrl: "https://twitter.com/treasurydock",
    websiteUrl: "https://treasurydock.app",
    tokenMint: null,
    builderName: "Luca Jay",
  },
  {
    name: "WhaleWire",
    tagline: "Smart alerts for impactful Bags wallet moves",
    description:
      "WhaleWire detects unusual token flows and surfaces context-rich alerts with confidence scoring. Traders can filter by pool depth, holder concentration, and historical signal quality.",
    twitterUrl: "https://twitter.com/whalewire",
    websiteUrl: "https://whalewire.tools",
    tokenMint: "M9r7Dx2Kq5Ph1Zb8Cv4Nt6Ls0Yw3Fa9Gj2He5Uk4",
    builderName: "Vera Node",
  },
  {
    name: "MintBrief",
    tagline: "Public changelog pages for NFT communities",
    description:
      "MintBrief gives NFT projects an immutable update feed where teams can post announcements, roadmap milestones, and utility drops. Holders get one trusted source of truth.",
    twitterUrl: "https://twitter.com/mintbrief",
    websiteUrl: "https://mintbrief.xyz",
    tokenMint: null,
    builderName: "Sam Quill",
  },
  {
    name: "QuickRamp",
    tagline: "One-click payment links for SOL and SPL tokens",
    description:
      "QuickRamp creates mobile-friendly payment links and QR codes for creators and merchants. Buyers pay instantly with any Solana wallet while merchants track conversions in a simple dashboard.",
    twitterUrl: "https://twitter.com/quickramp",
    websiteUrl: "https://quickramp.pay",
    tokenMint: null,
    builderName: "Maya Volt",
  },
  {
    name: "EpochLens",
    tagline: "Validator performance insights in plain language",
    description:
      "EpochLens turns validator metrics into practical recommendations for delegators. It highlights reliability shifts, reward trends, and risk flags before each epoch rotation.",
    twitterUrl: "https://twitter.com/epochlens",
    websiteUrl: "https://epochlens.io",
    tokenMint: null,
    builderName: "Noah Stake",
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.swipe.deleteMany();
  await prisma.session.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        email: "user@pitchr.dev",
        name: "Demo User",
        role: "USER",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser",
      },
      {
        email: "admin@pitchr.dev",
        name: "Demo Admin",
        role: "ADMIN",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoAdmin",
      },
    ],
  });

  await prisma.project.createMany({
    data: projectSeed.map((project) => ({
      ...project,
      builderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(project.builderName)}`,
      logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(project.name)}`,
    })),
  });

  console.log(`Seeded ${projectSeed.length} projects and 2 users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
