export type ProjectListItem = {
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  iconUrl: string | null;
  twitterUsername: string | null;
  twitterVerified: boolean | null;
  hasLaunchCreator: boolean | null;
  tokenAddress: string | null;
  claimsUniqueWallets: number | null;
  creatorCount: number | null;
  createdAtFromSource: string | null;
};

export type ProjectDetail = {
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  iconUrl: string | null;
  sourceUrl: string | null;
  twitterUrl: string | null;
  twitterUsername: string | null;
  twitterVerified: boolean | null;
  hasLaunchCreator: boolean | null;
  tokenAddress: string | null;
  claimsUniqueWallets: number | null;
  creatorCount: number | null;
  twitterFollowersCount: number | null;
  twitterFollowingCount: number | null;
  createdAtFromSource: string | null;
};
