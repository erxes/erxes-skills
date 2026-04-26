import { gql } from "@apollo/client";

export type PageInfo = {
  cursor?: string;
  totalCount?: number;
};

export type PostTag = {
  _id: string;
  clientPortalId: string;
  name?: string;
  slug?: string;
  colorCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PostTagList = {
  tags: PostTag[];
  totalCount: number;
  pageInfo: PageInfo;
};

const TAG_FRAGMENT = gql`
  fragment TagFields on PostTag {
    _id
    clientPortalId
    name
    slug
    colorCode
    createdAt
    updatedAt
  }
`;

export const CP_CMS_TAGS = gql`
  ${TAG_FRAGMENT}
  query CpCmsTags(
    $language: String
    $searchValue: String
    $sortField: String
    $sortDirection: String
    $cursor: String
    $limit: Int
  ) {
    cpCmsTags(
      language: $language
      searchValue: $searchValue
      sortField: $sortField
      sortDirection: $sortDirection
      cursor: $cursor
      limit: $limit
    ) {
      tags {
        ...TagFields
      }
      totalCount
      pageInfo {
        cursor
        totalCount
      }
    }
  }
`;

export type CpCmsTagsVariables = {
  language?: string;
  searchValue?: string;
  sortField?: string;
  sortDirection?: string;
  cursor?: string;
  limit?: number;
};

export type CpCmsTagsData = {
  cpCmsTags: PostTagList;
};
