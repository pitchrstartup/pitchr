export const BAGS_SOURCE = "bags_hackathon" as const;
export const BAGS_API_BASE_URL = "https://api2.bags.fm/api/v1" as const;

export type BagsHackathonListProject = {
  _id?: string;
  uuid?: string;
  icon?: string;
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  twitterUrl?: string;
  tokenAddress?: string;
  upvotes?: number;
  downvotes?: number;
};

export type BagsHackathonListResponse = {
  success: boolean;
  response?: {
    applications?: BagsHackathonListProject[];
    currentPage?: number;
    totalItems?: number;
    totalPages?: number;
  };
};

export type BagsTwitterUser = {
  id?: string;
  username?: string;
  name?: string;
  profile_image_url?: string;
  verified?: boolean;
};

export type BagsHackathonDetailProject = BagsHackathonListProject & {
  userId?: string;
  createdAt?: string;
  twitterUser?: BagsTwitterUser;
};

export type BagsHackathonDetailResponse = {
  success: boolean;
  response?: BagsHackathonDetailProject | string;
};

export type ImportedProjectInput = {
  source: string;
  sourceProjectId: string;
  sourceUrl: string;
  name: string | null;
  description: string | null;
  category: string | null;
  sourceStatus: string | null;
  iconUrl: string | null;
  twitterUrl: string | null;
  tokenAddress: string | null;
  upvotes: number | null;
  downvotes: number | null;
  sourceCreatedAt: Date | null;
  twitterUserId: string | null;
  twitterUsername: string | null;
  twitterName: string | null;
  twitterProfileImage: string | null;
  twitterVerified: boolean | null;
  rawListPayload: unknown;
  rawDetailPayload: unknown;
};
