import { gql } from "@apollo/client";

export type Attachment = {
  name: string;
  url: string;
  type: string;
  size: number;
};

export type PageItem = {
  _id: string;
  name?: string;
  type?: string;
  content?: string;
  order?: number;
  objectType?: string;
  objectId?: string;
  config?: Record<string, unknown>;
};

export type PageInfo = {
  cursor?: string;
  totalCount?: number;
};

export type Page = {
  _id: string;
  clientPortalId: string;
  name?: string;
  slug?: string;
  description?: string;
  content?: string;
  status?: string;
  type?: string;
  parentId?: string;
  thumbnail?: Attachment;
  pageImages?: Attachment[];
  videoUrl?: string;
  pageItems?: PageItem[];
  customFieldsData?: Record<string, unknown>;
  customFieldsMap?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type PageList = {
  pages: Page[];
  totalCount: number;
  pageInfo: PageInfo;
};

const PAGE_FRAGMENT = gql`
  fragment PageFields on Page {
    _id
    clientPortalId
    name
    slug
    description
    content
    status
    type
    parentId
    thumbnail {
      name
      url
      type
      size
    }
    pageImages {
      name
      url
      type
      size
    }
    videoUrl
    pageItems {
      _id
      name
      type
      content
      order
      objectType
      objectId
      config
    }
    customFieldsData
    createdAt
    updatedAt
  }
`;

export const CP_PAGES = gql`
  ${PAGE_FRAGMENT}
  query CpPages($language: String) {
    cpPages(language: $language) {
      ...PageFields
    }
  }
`;

export type CpPagesVariables = {
  language?: string;
};

export type CpPagesData = {
  cpPages: Page[];
};

export const CP_PAGE_LIST = gql`
  ${PAGE_FRAGMENT}
  query CpPageList($language: String, $cursor: String, $limit: Int) {
    cpPageList(language: $language, cursor: $cursor, limit: $limit) {
      pages {
        ...PageFields
      }
      totalCount
      pageInfo {
        cursor
        totalCount
      }
    }
  }
`;

export type CpPageListVariables = {
  language?: string;
  cursor?: string;
  limit?: number;
};

export type CpPageListData = {
  cpPageList: PageList;
};
