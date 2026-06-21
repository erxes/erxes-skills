---
title: erxes GraphQL API – Operations by scope
description: Full reference for calling GraphQL mutations/queries after obtaining an OAuth token
---

# erxes GraphQL API – Operations by scope

After obtaining a token via the OAuth Device Flow, call the GraphQL endpoint.
Login details: `erxes-app-token-auth.md`

---

## Endpoint

```txt
POST http://localhost:4000/graphql
```

---

## Headers (on every call)

```http
Content-Type: application/json
erxes-subdomain: <subdomain>
Authorization: Bearer <accessToken>
```

---

## Request Format

```json
{
  "query": "<GraphQL mutation or query string>",
  "variables": { ... }
}
```

---

# Operations by scope

---

## contacts:read

### customers — List

```graphql
query Customers($page: Int, $perPage: Int, $searchValue: String) {
  customers(page: $page, perPage: $perPage, searchValue: $searchValue) {
    _id
    firstName
    lastName
    primaryEmail
    primaryPhone
    state
    createdAt
  }
}
```

```json
{
  "query": "query Customers($page: Int, $perPage: Int, $searchValue: String) { customers(page: $page, perPage: $perPage, searchValue: $searchValue) { _id firstName lastName primaryEmail primaryPhone state createdAt } }",
  "variables": { "page": 1, "perPage": 20 }
}
```

### customerDetail — View one in detail

```graphql
query CustomerDetail($_id: String!) {
  customerDetail(_id: $_id) {
    _id
    firstName
    lastName
    primaryEmail
    primaryPhone
    state
    createdAt
    ownerId
  }
}
```

---

## contacts:create

### customersAdd — Create a customer

```graphql
mutation CustomersAdd(
  $firstName: String
  $lastName: String
  $primaryEmail: String
  $primaryPhone: String
  $state: String
) {
  customersAdd(
    firstName: $firstName
    lastName: $lastName
    primaryEmail: $primaryEmail
    primaryPhone: $primaryPhone
    state: $state
  ) {
    _id
    firstName
    lastName
    primaryEmail
    primaryPhone
    state
  }
}
```

```json
{
  "query": "mutation CustomersAdd($firstName: String, $lastName: String, $primaryEmail: String, $primaryPhone: String, $state: String) { customersAdd(firstName: $firstName, lastName: $lastName, primaryEmail: $primaryEmail, primaryPhone: $primaryPhone, state: $state) { _id firstName lastName primaryEmail state } }",
  "variables": {
    "firstName": "Bat",
    "lastName": "Bold",
    "primaryEmail": "bat@example.com",
    "primaryPhone": "+97699001122",
    "state": "customer"
  }
}
```

**Response**

```json
{
  "data": {
    "customersAdd": {
      "_id": "abc123...",
      "firstName": "Bat",
      "lastName": "Bold",
      "primaryEmail": "bat@example.com",
      "state": "customer"
    }
  }
}
```

---

## contacts:update

### customersEdit — Edit information

```graphql
mutation CustomersEdit(
  $_id: String!
  $firstName: String
  $lastName: String
  $primaryEmail: String
  $primaryPhone: String
) {
  customersEdit(
    _id: $_id
    firstName: $firstName
    lastName: $lastName
    primaryEmail: $primaryEmail
    primaryPhone: $primaryPhone
  ) {
    _id
    firstName
    lastName
    primaryEmail
    primaryPhone
  }
}
```

```json
{
  "query": "mutation CustomersEdit($_id: String!, $firstName: String, $primaryPhone: String) { customersEdit(_id: $_id, firstName: $firstName, primaryPhone: $primaryPhone) { _id firstName primaryPhone } }",
  "variables": {
    "_id": "abc123...",
    "firstName": "Bataa",
    "primaryPhone": "+97699009900"
  }
}
```

---

## contacts:remove

### customersRemove — Delete

```graphql
mutation CustomersRemove($customerIds: [String]) {
  customersRemove(customerIds: $customerIds)
}
```

```json
{
  "query": "mutation CustomersRemove($customerIds: [String]) { customersRemove(customerIds: $customerIds) }",
  "variables": {
    "customerIds": ["abc123...", "def456..."]
  }
}
```

---

## contacts:merge

### customersMerge — Merge

```graphql
mutation CustomersMerge($customerIds: [String], $customerFields: JSON) {
  customersMerge(customerIds: $customerIds, customerFields: $customerFields) {
    _id
    firstName
    lastName
    primaryEmail
  }
}
```

```json
{
  "query": "mutation CustomersMerge($customerIds: [String], $customerFields: JSON) { customersMerge(customerIds: $customerIds, customerFields: $customerFields) { _id firstName lastName primaryEmail } }",
  "variables": {
    "customerIds": ["abc123...", "def456..."],
    "customerFields": {
      "firstName": "Bat",
      "primaryEmail": "bat@example.com"
    }
  }
}
```

---

## products:read

### products — List

```graphql
query Products($page: Int, $perPage: Int, $searchValue: String) {
  products(page: $page, perPage: $perPage, searchValue: $searchValue) {
    _id
    name
    code
    unitPrice
    type
    categoryId
  }
}
```

---

## products:create

### productsAdd — Create a product

```graphql
mutation ProductsAdd(
  $name: String
  $code: String
  $categoryId: String
  $type: String
  $unitPrice: Float
  $uom: String
) {
  productsAdd(
    name: $name
    code: $code
    categoryId: $categoryId
    type: $type
    unitPrice: $unitPrice
    uom: $uom
  ) {
    _id
    name
    code
    unitPrice
  }
}
```

```json
{
  "query": "mutation ProductsAdd($name: String, $code: String, $unitPrice: Float) { productsAdd(name: $name, code: $code, unitPrice: $unitPrice) { _id name code unitPrice } }",
  "variables": {
    "name": "Water 0.5L",
    "code": "WTR-001",
    "unitPrice": 1500
  }
}
```

---

## products:update

### productsEdit — Edit

```graphql
mutation ProductsEdit($_id: String!, $name: String, $unitPrice: Float) {
  productsEdit(_id: $_id, name: $name, unitPrice: $unitPrice) {
    _id
    name
    unitPrice
  }
}
```

---

## products:remove

### productsRemove — Delete

```graphql
mutation ProductsRemove($productIds: [String!]) {
  productsRemove(productIds: $productIds)
}
```

---

## products:merge

### productsMerge — Merge

```graphql
mutation ProductsMerge($productIds: [String], $productFields: JSON) {
  productsMerge(productIds: $productIds, productFields: $productFields) {
    _id
    name
  }
}
```

---

## products:manage

### productCategoriesAdd — Create a category

```graphql
mutation ProductCategoriesAdd($name: String!, $code: String, $parentId: String) {
  productCategoriesAdd(name: $name, code: $code, parentId: $parentId) {
    _id
    name
    code
  }
}
```

### uomsAdd — Create a unit of measure

```graphql
mutation UomsAdd($name: String!, $code: String!) {
  uomsAdd(name: $name, code: $code) {
    _id
    name
    code
  }
}
```

---

## tags:read

### tags — List

```graphql
query Tags($type: String) {
  tags(type: $type) {
    _id
    name
    type
    colorCode
  }
}
```

---

## tags:create

### tagsAdd — Create a tag

```graphql
mutation TagsAdd($name: String!, $type: String!, $colorCode: String) {
  tagsAdd(name: $name, type: $type, colorCode: $colorCode) {
    _id
    name
    type
    colorCode
  }
}
```

```json
{
  "query": "mutation TagsAdd($name: String!, $type: String!, $colorCode: String) { tagsAdd(name: $name, type: $type, colorCode: $colorCode) { _id name type } }",
  "variables": {
    "name": "VIP",
    "type": "contacts:customer",
    "colorCode": "#FF0000"
  }
}
```

---

## tags:update

### tagsEdit — Edit a tag

```graphql
mutation TagsEdit($_id: String!, $name: String, $colorCode: String) {
  tagsEdit(_id: $_id, name: $name, colorCode: $colorCode) {
    _id
    name
    colorCode
  }
}
```

---

## tags:remove

### tagsRemove — Delete a tag

```graphql
mutation TagsRemove($_id: String!) {
  tagsRemove(_id: $_id)
}
```

---

## tags:tag

### tagsTag — Attach a tag to an object

```graphql
mutation TagsTag($type: String!, $targetIds: [String!]!, $tagIds: [String!]!) {
  tagsTag(type: $type, targetIds: $targetIds, tagIds: $tagIds)
}
```

```json
{
  "query": "mutation TagsTag($type: String!, $targetIds: [String!]!, $tagIds: [String!]!) { tagsTag(type: $type, targetIds: $targetIds, tagIds: $tagIds) }",
  "variables": {
    "type": "contacts:customer",
    "targetIds": ["abc123..."],
    "tagIds": ["tag456..."]
  }
}
```

---

## documents:read

### documents — List

```graphql
query Documents($contentType: String) {
  documents(contentType: $contentType) {
    _id
    name
    contentType
    subType
    code
  }
}
```

---

## documents:create + documents:update

### documentsSave — Create / Edit

If `_id` is provided it edits; otherwise it creates a new one.

```graphql
mutation DocumentsSave(
  $_id: String
  $name: String!
  $contentType: String
  $content: String
  $code: String
) {
  documentsSave(
    _id: $_id
    name: $name
    contentType: $contentType
    content: $content
    code: $code
  ) {
    _id
    name
    contentType
  }
}
```

---

## documents:remove

### documentsRemove — Delete

```graphql
mutation DocumentsRemove($_id: String!) {
  documentsRemove(_id: $_id)
}
```

---

## brands:read

### brands — List

```graphql
query Brands {
  brands {
    _id
    name
    description
  }
}
```

---

## brands:create

### brandsAdd — Create a brand

```graphql
mutation BrandsAdd($name: String!, $description: String) {
  brandsAdd(name: $name, description: $description) {
    _id
    name
    description
  }
}
```

---

## brands:update

### brandsEdit — Edit a brand

```graphql
mutation BrandsEdit($_id: String!, $name: String!, $description: String) {
  brandsEdit(_id: $_id, name: $name, description: $description) {
    _id
    name
  }
}
```

---

## brands:remove

### brandsRemove — Delete

```graphql
mutation BrandsRemove($ids: [String!]) {
  brandsRemove(ids: $ids)
}
```

---

## organization:read

### structures — Organization structure

```graphql
query Structures {
  structures {
    _id
    title
    departments { _id title }
    branches { _id title }
  }
}
```

---

## organization:manage

### departmentsAdd — Create a department

```graphql
mutation DepartmentsAdd($title: String!, $description: String, $parentId: String) {
  departmentsAdd(title: $title, description: $description, parentId: $parentId) {
    _id
    title
  }
}
```

### branchesAdd — Create a branch

```graphql
mutation BranchesAdd($title: String!, $address: String, $parentId: String) {
  branchesAdd(title: $title, address: $address, parentId: $parentId) {
    _id
    title
  }
}
```

---

## teamMembers:read

### users — Member list

```graphql
query Users($page: Int, $perPage: Int, $searchValue: String) {
  users(page: $page, perPage: $perPage, searchValue: $searchValue) {
    _id
    email
    username
    details {
      fullName
      position
    }
    isActive
  }
}
```

---

## teamMembers:create

### usersInvite — Invite a new member

```graphql
mutation UsersInvite($entries: [InvitationEntry]) {
  usersInvite(entries: $entries)
}
```

```json
{
  "query": "mutation UsersInvite($entries: [InvitationEntry]) { usersInvite(entries: $entries) }",
  "variables": {
    "entries": [
      { "email": "newmember@example.com", "password": "TempPass123" }
    ]
  }
}
```

---

## teamMembers:update

### usersEdit — Edit a member

```graphql
mutation UsersEdit($_id: String!, $details: UserDetails, $groupIds: [String]) {
  usersEdit(_id: $_id, details: $details, groupIds: $groupIds) {
    _id
    email
    details {
      fullName
      position
    }
  }
}
```

---

## teamMembers:remove

### usersSetActiveStatus — Deactivate

```graphql
mutation UsersSetActiveStatus($_id: String!) {
  usersSetActiveStatus(_id: $_id) {
    _id
    isActive
  }
}
```

---

## automations:read

### automations — List

```graphql
query Automations($page: Int, $perPage: Int) {
  automations(page: $page, perPage: $perPage) {
    _id
    name
    status
    triggers { type }
    actions { type }
  }
}
```

---

## automations:create

### automationsAdd — Create an automation

```graphql
mutation AutomationsAdd($name: String!, $status: String) {
  automationsAdd(name: $name, status: $status) {
    _id
    name
    status
  }
}
```

```json
{
  "query": "mutation AutomationsAdd($name: String!, $status: String) { automationsAdd(name: $name, status: $status) { _id name status } }",
  "variables": {
    "name": "Greet new customer",
    "status": "draft"
  }
}
```

---

## automations:update

### automationsEdit — Edit

```graphql
mutation AutomationsEdit($_id: String, $name: String, $status: String) {
  automationsEdit(_id: $_id, name: $name, status: $status) {
    _id
    name
    status
  }
}
```

---

## automations:delete

### automationsRemove — Delete

```graphql
mutation AutomationsRemove($automationIds: [String]) {
  automationsRemove(automationIds: $automationIds)
}
```

---

# Error Handling

```json
{
  "errors": [
    {
      "message": "Permission denied",
      "path": ["customersAdd"]
    }
  ],
  "data": null
}
```

| Error | Cause | Action |
|-------|---------|--------|
| `Permission denied` | Live API access rejection | Check whether this is an owner session and the runtime access for that environment |
| `Unauthorized` | `accessToken` expired or invalid | Refresh the token |
| `Not authenticated` | `Authorization` header missing | Add the header |

> If you get `Unauthorized`, follow **Step 4** in `erxes-app-token-auth.md`.

---

# Quick Reference

| Scope | Mutation / Query |
|-------|-----------------|
| `contacts:read` | `customers`, `customerDetail` |
| `contacts:create` | `customersAdd` |
| `contacts:update` | `customersEdit` |
| `contacts:remove` | `customersRemove` |
| `contacts:merge` | `customersMerge` |
| `products:read` | `products`, `productDetail` |
| `products:create` | `productsAdd` |
| `products:update` | `productsEdit` |
| `products:remove` | `productsRemove` |
| `products:merge` | `productsMerge` |
| `products:manage` | `productCategoriesAdd/Edit/Remove`, `uomsAdd/Edit/Remove` |
| `tags:read` | `tags` |
| `tags:create` | `tagsAdd` |
| `tags:update` | `tagsEdit` |
| `tags:remove` | `tagsRemove` |
| `tags:tag` | `tagsTag` |
| `documents:read` | `documents` |
| `documents:create` + `documents:update` | `documentsSave` |
| `documents:remove` | `documentsRemove` |
| `brands:read` | `brands` |
| `brands:create` | `brandsAdd` |
| `brands:update` | `brandsEdit` |
| `brands:remove` | `brandsRemove` |
| `organization:read` | `structures`, `departments`, `branches` |
| `organization:manage` | `departmentsAdd/Edit/Remove`, `branchesAdd/Edit/Remove` |
| `teamMembers:read` | `users` |
| `teamMembers:create` | `usersInvite` |
| `teamMembers:update` | `usersEdit` |
| `teamMembers:remove` | `usersSetActiveStatus` |
| `automations:read` | `automations` |
| `automations:create` | `automationsAdd` |
| `automations:update` | `automationsEdit` |
| `automations:delete` | `automationsRemove` |

---

## Private Plugin Index

Exact private-plugin GraphQL operations are maintained plugin by plugin:

- `block_api`: see `block-api.md`
- `operation_api`: see `operation-api.md`

Use those files when the user asks about SaaS workflows for blocks, projects, zonings, units, opportunities, tasks, triage, teams, statuses, cycles, milestones, notes, activities, or templates.
