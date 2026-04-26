import { gql } from "@apollo/client";

export type PostStatus = "draft" | "published" | "scheduled" | "archived";
export type PostDateField = "createdAt" | "updatedAt" | "scheduledDate" | "publishedDate";
export type PostReactionType = "like" | "love" | "angry" | "sad" | "happy";

export type Attachment = {
  name: string;
  url: string;
  type: string;
  size: number;
};

export type PostTag = {
  _id: string;
  name?: string;
  slug?: string;
  colorCode?: string;
};

export type PostCategory = {
  _id: string;
  name?: string;
  slug?: string;
};

export type PageInfo = {
  cursor?: string;
  totalCount?: number;
};

export type Post = {
  _id: string;
  type?: string;
  webId?: string;
  clientPortalId: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  categoryIds?: string[];
  categories?: PostCategory[];
  tagIds?: string[];
  tags?: PostTag[];
  status?: PostStatus;
  featured?: boolean;
  featuredDate?: string;
  scheduledDate?: string;
  publishedDate?: string;
  autoArchiveDate?: string;
  viewCount?: number;
  reactionCounts?: Record<string, number>;
  thumbnail?: Attachment;
  images?: Attachment[];
  videoUrl?: string;
  customFieldsData?: Record<string, unknown>;
  customFieldsMap?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type PostList = {
  posts: Post[];
  totalCount: number;
  pageInfo: PageInfo;
};

const POST_FRAGMENT = gql`
  fragment PostFields on Post {
    _id
    type
    webId
    clientPortalId
    title
    slug
    excerpt
    content
    status
    featured
    featuredDate
    publishedDate
    scheduledDate
    viewCount
    reactionCounts
    thumbnail {
      name
      url
      type
      size
    }
    images {
      name
      url
      type
      size
    }
    videoUrl
    categoryIds
    categories {
      _id
      name
      slug
    }
    tagIds
    tags {
      _id
      name
      slug
      colorCode
    }
    customFieldsData
    createdAt
    updatedAt
  }
`;

export const CP_POST = gql`
  ${POST_FRAGMENT}
  query CpPost(
    $_id: String
    $slug: String
    $identifier: String
    $language: String
  ) {
    cpPost(
      _id: $_id
      slug: $slug
      identifier: $identifier
      language: $language
    ) {
      ...PostFields
    }
  }
`;

export type CpPostVariables = {
  _id?: string;
  slug?: string;
  identifier?: string;
  language?: string;
};

export type CpPostData = {
  cpPost: Post | null;
};

export const CP_POSTS = gql`
  ${POST_FRAGMENT}
  query CpPosts(
    $language: String
    $webId: String
    $featured: Boolean
    $type: String
    $categoryIds: [String]
    $searchValue: String
    $status: PostStatus
    $tagIds: [String]
    $sortField: String
    $sortDirection: String
    $dateField: PostDateField
    $dateFrom: Date
    $dateTo: Date
    $cursor: String
    $limit: Int
  ) {
    cpPosts(
      language: $language
      webId: $webId
      featured: $featured
      type: $type
      categoryIds: $categoryIds
      searchValue: $searchValue
      status: $status
      tagIds: $tagIds
      sortField: $sortField
      sortDirection: $sortDirection
      dateField: $dateField
      dateFrom: $dateFrom
      dateTo: $dateTo
      cursor: $cursor
      limit: $limit
    ) {
      ...PostFields
    }
  }
`;

export type CpPostsVariables = {
  language?: string;
  webId?: string;
  featured?: boolean;
  type?: string;
  categoryIds?: string[];
  searchValue?: string;
  status?: PostStatus;
  tagIds?: string[];
  sortField?: string;
  sortDirection?: string;
  dateField?: PostDateField;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
};

export type CpPostsData = {
  cpPosts: Post[];
};

export const CP_POST_LIST = gql`
  ${POST_FRAGMENT}
  query CpPostList(
    $language: String
    $webId: String
    $featured: Boolean
    $type: String
    $categoryIds: [String]
    $searchValue: String
    $status: PostStatus
    $tagIds: [String]
    $sortField: String
    $sortDirection: String
    $dateField: PostDateField
    $dateFrom: Date
    $dateTo: Date
    $cursor: String
    $limit: Int
  ) {
    cpPostList(
      language: $language
      webId: $webId
      featured: $featured
      type: $type
      categoryIds: $categoryIds
      searchValue: $searchValue
      status: $status
      tagIds: $tagIds
      sortField: $sortField
      sortDirection: $sortDirection
      dateField: $dateField
      dateFrom: $dateFrom
      dateTo: $dateTo
      cursor: $cursor
      limit: $limit
    ) {
      posts {
        ...PostFields
      }
      totalCount
      pageInfo {
        cursor
        totalCount
      }
    }
  }
`;

export type CpPostListVariables = CpPostsVariables;

export type CpPostListData = {
  cpPostList: PostList;
};

export const CP_MOST_VIEWED_POSTS = gql`
  ${POST_FRAGMENT}
  query CpMostViewedPosts(
    $days: Int!
    $limit: Int
    $language: String
    $webId: String
    $type: String
  ) {
    cpMostViewedPosts(
      days: $days
      limit: $limit
      language: $language
      webId: $webId
      type: $type
    ) {
      ...PostFields
    }
  }
`;

export type CpMostViewedPostsVariables = {
  days: number;
  limit?: number;
  language?: string;
  webId?: string;
  type?: string;
};

export type CpMostViewedPostsData = {
  cpMostViewedPosts: Post[];
};
