import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const existing = await prisma.project.count();
  if (existing > 0) {
    console.log(`Skipping — ${existing} projects already exist`);
    return;
  }

  const projects = [
    {
      name: "BagScope",
      tagline: "Real-time fee analytics dashboard for Bags tokens",
      description:
        "BagScope gives holders and traders a live view of fee flows across every Bags token pair. Track 24h volume, maker/taker splits, protocol revenue, and wallet-level fee history — all in a clean dark dashboard. No more guessing where your fees are going.",
      twitterUrl: "https://twitter.com/bagscope",
      websiteUrl: "https://bagscope.xyz",
      builderName: "0xKira",
    },
    {
      name: "SolRepute",
      tagline: "On-chain reputation scoring for Solana wallets",
      description:
        "SolRepute aggregates transaction history, DeFi interactions, NFT activity, and DAO votes to produce a single reputation score for any Solana wallet. Useful for gating access, whitelist screening, and lending underwriting. Built with a public API so any project can integrate it.",
      twitterUrl: "https://twitter.com/solrepute",
      websiteUrl: null,
      builderName: "prism_labs",
    },
    {
      name: "GatePass",
      tagline: "Token-gated community tool powered by Bags",
      description:
        "GatePass lets any creator spin up a token-gated Discord or Telegram room in under 2 minutes using their Bags token as the key. Holders get automatic role assignment and the creator sets the threshold. No bots to manage — everything runs via wallet signature verification.",
      twitterUrl: "https://twitter.com/gatepass_sol",
      websiteUrl: "https://gatepass.so",
      builderName: "devjuno",
    },
    {
      name: "FlowBot",
      tagline: "Automated trading bot with built-in fee sharing for holders",
      description:
        "FlowBot is a Solana DEX trading bot that redistributes 10% of its profits back to token holders every epoch. Users configure strategies via a no-code UI, the bot executes on-chain, and fees flow automatically to stakers. Transparent PnL dashboard included.",
      twitterUrl: "https://twitter.com/flowbot_sol",
      websiteUrl: "https://flowbot.finance",
      builderName: "satoshi_jr",
    },
    {
      name: "CreatorLedger",
      tagline: "Monetization tracker for on-chain creator economies",
      description:
        "CreatorLedger helps Solana-native creators track every revenue stream in one place: NFT royalties, tip transactions, token-gated subscriptions, and Bags fee earnings. CSV exports, tax-ready reports, and a public profile page for fans to see creator stats.",
      twitterUrl: null,
      websiteUrl: "https://creatorledger.io",
      builderName: "mplx_hacker",
    },
    {
      name: "VaultKey",
      tagline: "Multi-sig treasury management for Solana DAOs",
      description:
        "VaultKey is a Squads-compatible treasury UI that adds proposal templates, spending limits, and an activity feed to multi-sig wallets. Designed for small DAOs and project treasuries that want governance without the complexity of full on-chain voting programs.",
      twitterUrl: "https://twitter.com/vaultkey_dao",
      websiteUrl: "https://vaultkey.app",
      builderName: "dao_architect",
    },
    {
      name: "PumpAlert",
      tagline: "Whale wallet monitoring and alert service for Bags pairs",
      description:
        "PumpAlert watches a curated list of whale wallets and sends Telegram or email alerts whenever a tracked wallet makes a significant move on a Bags token pair. Set your own thresholds, filter by token, and get context like wallet age and past win rate.",
      twitterUrl: "https://twitter.com/pumpalert_sol",
      websiteUrl: null,
      builderName: "whalehunter42",
    },
    {
      name: "MintMemo",
      tagline: "On-chain note-taking and documentation for NFT collections",
      description:
        "MintMemo lets NFT project teams attach versioned, on-chain memos to their collection: roadmap updates, holder announcements, and lore entries — all stored immutably and displayed in a clean reader UI. Think Notion meets Arweave, built for Solana projects.",
      twitterUrl: "https://twitter.com/mintmemo_xyz",
      websiteUrl: "https://mintmemo.xyz",
      builderName: "nft_wordsmith",
    },
    {
      name: "SolPay Link",
      tagline: "Payment links for Solana — no wallet setup required for payers",
      description:
        "SolPay Link generates shareable payment URLs that let anyone send SOL or SPL tokens without needing to know how wallets work. The payer scans a QR code or clicks a link, signs with their existing wallet, and the payment lands instantly. Perfect for creators and small merchants.",
      twitterUrl: "https://twitter.com/solpaylink",
      websiteUrl: "https://solpay.link",
      builderName: "quickpay_dev",
    },
    {
      name: "EpochStats",
      tagline: "Solana validator and staking analytics in plain English",
      description:
        "EpochStats translates raw Solana staking data into plain-English summaries: which validators are outperforming, estimated APY changes next epoch, and unstake timing recommendations. Aimed at retail stakers who want to optimize yield without becoming protocol experts.",
      twitterUrl: "https://twitter.com/epochstats",
      websiteUrl: "https://epochstats.io",
      builderName: "stake_nerd",
    },
  ];

  await prisma.project.createMany({ data: projects });
  console.log(`Seeded ${projects.length} projects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
