import { gql } from "@apollo/client";

export type CustomPostType = {
  _id: string;
  clientPortalId: string;
  code: string;
  label: string;
  pluralLabel: string;
  description?: string;
  createdAt?: string;
};

export type CustomFieldGroup = {
  _id: string;
  clientPortalId: string;
  parentId?: string;
  label: string;
  code?: string;
  order?: number;
  customPostTypeIds?: string[];
  customPostTypes?: CustomPostType[];
  enabledPageIds?: string[];
  enabledCategoryIds?: string[];
  enabledPostIds?: string[];
  fields?: Record<string, unknown>;
  createdAt?: string;
};

const CUSTOM_POST_TYPE_FRAGMENT = gql`
  fragment CustomPostTypeFields on CustomPostType {
    _id
    clientPortalId
    code
    label
    pluralLabel
    description
    createdAt
  }
`;

const CUSTOM_FIELD_GROUP_FRAGMENT = gql`
  ${CUSTOM_POST_TYPE_FRAGMENT}
  fragment CustomFieldGroupFields on CustomFieldGroup {
    _id
    clientPortalId
    parentId
    label
    code
    order
    customPostTypeIds
    customPostTypes {
      ...CustomPostTypeFields
    }
    enabledPageIds
    enabledCategoryIds
    enabledPostIds
    fields
    createdAt
  }
`;

export const CP_CUSTOM_POST_TYPES = gql`
  ${CUSTOM_POST_TYPE_FRAGMENT}
  query CpCustomPostTypes($searchValue: String) {
    cpCustomPostTypes(searchValue: $searchValue) {
      ...CustomPostTypeFields
    }
  }
`;

export type CpCustomPostTypesVariables = {
  searchValue?: string;
};

export type CpCustomPostTypesData = {
  cpCustomPostTypes: CustomPostType[];
};

export const CP_CUSTOM_FIELD_GROUPS = gql`
  ${CUSTOM_FIELD_GROUP_FRAGMENT}
  query CpCustomFieldGroups(
    $searchValue: String
    $pageId: String
    $categoryId: String
    $postType: String
    $postId: String
  ) {
    cpCustomFieldGroups(
      searchValue: $searchValue
      pageId: $pageId
      categoryId: $categoryId
      postType: $postType
      postId: $postId
    ) {
      ...CustomFieldGroupFields
    }
  }
`;

export type CpCustomFieldGroupsVariables = {
  searchValue?: string;
  pageId?: string;
  categoryId?: string;
  postType?: string;
  postId?: string;
};

export type CpCustomFieldGroupsData = {
  cpCustomFieldGroups: CustomFieldGroup[];
};
