import { gql } from "@apollo/client";

export const GET_PAGES = gql`
  query CpPages($language: String) {
    cpPages(language: $language) {
      _id name slug status content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_PAGE_BY_SLUG = gql`
  query CpPageBySlug($slug: String!, $language: String) {
    cpPages(language: $language, slug: $slug) {
      _id name slug status content
      pageItems { _id name type content order config }
    }
  }
`;

export const GET_POSTS = gql`
  query CpPosts($language: String, $categoryId: String, $page: Int, $perPage: Int) {
    cpPosts(language: $language, status: published, categoryId: $categoryId, page: $page, perPage: $perPage) {
      _id title slug excerpt content featured publishedDate categoryIds tagIds
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query CpPostBySlug($slug: String!, $language: String) {
    cpPostDetail(slug: $slug, language: $language) {
      _id title slug content excerpt featured publishedDate categoryIds tagIds
    }
  }
`;

export const GET_CATEGORIES = gql`
  query CpCategories($language: String) {
    cpCategories(language: $language) {
      list { _id name slug description }
    }
  }
`;

export const GET_TAGS = gql`
  query CpTags($language: String) {
    cpCmsTags(language: $language) {
      tags { _id name slug colorCode }
    }
  }
`;

export const GET_HEADER_MENU = gql`
  query CpHeaderMenu($language: String) {
    cpMenus(language: $language, kind: "header") {
      _id label url order target contentType contentTypeId
    }
  }
`;

export const GET_FOOTER_MENU = gql`
  query CpFooterMenu($language: String) {
    cpMenus(language: $language, kind: "footer") {
      _id label url order target
    }
  }
`;
