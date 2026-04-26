import { gql } from "@apollo/client";

export type MenuItem = {
  _id: string;
  clientPortalId: string;
  webId?: string;
  parentId?: string;
  parent?: MenuItem;
  label?: string;
  contentType?: string;
  contentTypeId?: string;
  kind?: string;
  icon?: string;
  url?: string;
  order?: number;
  target?: string;
};

const MENU_ITEM_FRAGMENT = gql`
  fragment MenuItemFields on MenuItem {
    _id
    clientPortalId
    webId
    parentId
    label
    contentType
    contentTypeId
    kind
    icon
    url
    order
    target
  }
`;

export const CP_MENUS = gql`
  ${MENU_ITEM_FRAGMENT}
  query CpMenus($language: String, $kind: String, $webId: String) {
    cpMenus(language: $language, kind: $kind, webId: $webId) {
      ...MenuItemFields
      parent {
        ...MenuItemFields
      }
    }
  }
`;

export type CpMenusVariables = {
  language?: string;
  kind?: string;
  webId?: string;
};

export type CpMenusData = {
  cpMenus: MenuItem[];
};

export const CP_CMS_MENU_LIST = gql`
  ${MENU_ITEM_FRAGMENT}
  query CpCmsMenuList(
    $clientPortalId: String
    $kind: String
    $language: String
    $cursor: String
    $limit: Int
  ) {
    cpCmsMenuList(
      clientPortalId: $clientPortalId
      kind: $kind
      language: $language
      cursor: $cursor
      limit: $limit
    ) {
      ...MenuItemFields
      parent {
        ...MenuItemFields
      }
    }
  }
`;

export type CpCmsMenuListVariables = {
  clientPortalId?: string;
  kind?: string;
  language?: string;
  cursor?: string;
  limit?: number;
};

export type CpCmsMenuListData = {
  cpCmsMenuList: MenuItem[];
};
