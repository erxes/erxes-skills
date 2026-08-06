# Ecommerce SDK Hooks (Mobile)

> `"use client"` directive байхгүй — Expo-д хэрэггүй.
> `src/hooks/` биш `hooks/` ашиглана.

---

## `hooks/auth.ts`

`sessionStorage` → `SecureStore` (async), `window.location.href` → `router.replace()`, `NEXT_PUBLIC_*` → `EXPO_PUBLIC_*`.

```typescript
import { useMutation, useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  LOGIN,
  REGISTER,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
} from "@/graphql/auth/mutations";
import { CURRENT_USER as CURRENT_USER_QUERY } from "@/graphql/auth/queries/currentUser";
import { currentUserAtom, triggerRefetchUserAtom } from "@/store/auth.store";
import {
  ILoginInput,
  IRegisterInput,
  IForgotPasswordInput,
  IResetPasswordInput,
} from "@/types/auth.types";

export function useCurrentUser() {
  const [trigger] = useAtom(triggerRefetchUserAtom);

  const { data, loading, error, refetch } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  return {
    currentUser: (data as any)?.clientPortalCurrentUser || null,
    loading,
    error,
    refetch,
    triggerRefetchUser: () => refetch(),
  };
}

export function useLogin() {
  const [loginMutation, { loading, error }] = useMutation(LOGIN);
  const { triggerRefetchUser } = useCurrentUser();
  const router = useRouter();

  const login = useCallback(
    async (input: ILoginInput) => {
      const { data } = await loginMutation({
        variables: { email: input.email, password: input.password },
      });

      const raw = (data as any)?.clientPortalUserLoginWithCredentials;
      const token = raw?.token;
      const refreshToken = raw?.refreshToken;

      if (token) {
        await SecureStore.setItemAsync("token", token);
        if (refreshToken)
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        triggerRefetchUser();

        const redirectAfterLogin =
          await SecureStore.getItemAsync("redirectAfterLogin");
        if (redirectAfterLogin) {
          await SecureStore.deleteItemAsync("redirectAfterLogin");
          router.replace(redirectAfterLogin as any);
          return { success: true, token, redirect: redirectAfterLogin };
        }
        router.replace("/(tabs)");
        return { success: true, token };
      }

      return { success: !!token, token };
    },
    [loginMutation, triggerRefetchUser, router],
  );

  return { login, loading, error };
}

export function useRegister() {
  const [registerMutation, { loading, error }] = useMutation(REGISTER);

  const register = useCallback(
    async (input: IRegisterInput) => {
      const { data } = await registerMutation({
        variables: {
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      });

      const user = (data as any)?.clientPortalUserRegister;
      return { success: !!user?._id, user };
    },
    [registerMutation],
  );

  return { register, loading, error };
}

export function useLogout() {
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const router = useRouter();

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refreshToken");
    setCurrentUser(null);
    router.replace("/");
  }, [setCurrentUser, router]);

  return { logout };
}

export function useForgotPassword() {
  const [mutation, { loading, error }] = useMutation(FORGOT_PASSWORD);

  const forgotPassword = useCallback(
    async (input: IForgotPasswordInput) => {
      const { data } = await mutation({
        variables: {
          email: input.email,
          clientPortalId: process.env.EXPO_PUBLIC_ERXES_CP_TOKEN,
        },
      });
      return { success: !!(data as any)?.clientPortalUserForgotPassword };
    },
    [mutation],
  );

  return { forgotPassword, loading, error };
}

export function useResetPassword() {
  const [mutation, { loading, error }] = useMutation(RESET_PASSWORD);

  const resetPassword = useCallback(
    async (input: IResetPasswordInput) => {
      const { data } = await mutation({
        variables: { token: input.token, newPassword: input.newPassword },
      });
      return { success: !!(data as any)?.clientPortalUserResetPassword };
    },
    [mutation],
  );

  return { resetPassword, loading, error };
}
```

---

## `hooks/order.ts`

```typescript
import { useMutation, useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { ORDERS_ADD, ORDERS_REMOVE } from "@/graphql/ecommerce/mutations/order";
import { ORDERS, ORDER_DETAIL } from "@/graphql/ecommerce/queries/order";
import { activeOrderAtom, orderLoadingAtom } from "@/store/order.store";
import { cartItemsAtom } from "@/store/cart.store";

export function useOrders(customerId?: string) {
  const { data, loading, error, refetch } = useQuery(ORDERS, {
    variables: { customerId, page: 1, perPage: 20 },
    skip: !customerId,
    fetchPolicy: "cache-and-network",
  });

  return {
    orders: (data as any)?.cpFullOrders || [],
    loading,
    error,
    refetch,
  };
}

export function useOrderDetail(orderId: string) {
  const { data, loading, error } = useQuery(ORDER_DETAIL, {
    variables: { _id: orderId },
    skip: !orderId,
    fetchPolicy: "cache-and-network",
  });

  return {
    order: (data as any)?.cpOrderDetail || null,
    loading,
    error,
  };
}

export function useOrderCUD() {
  const [addMutation, { loading: addLoading }] = useMutation(ORDERS_ADD);
  const [removeMutation, { loading: removeLoading }] =
    useMutation(ORDERS_REMOVE);
  const [, setActiveOrder] = useAtom(activeOrderAtom);
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [, setOrderLoading] = useAtom(orderLoadingAtom);

  const createOrder = useCallback(
    async (variables: {
      items: Array<{
        productId: string;
        count: number;
        unitPrice: number;
        discountAmount?: number;
        bonusCount?: number;
      }>;
      totalAmount: number;
      type: string;
      customerId?: string;
      customerType?: string;
      registerNumber?: string;
      billType?: string;
      deliveryInfo?: Record<string, unknown>;
    }) => {
      setOrderLoading(true);
      try {
        const calculatedTotal =
          variables.totalAmount > 0
            ? variables.totalAmount
            : variables.items.reduce(
                (sum, item) => sum + (item.unitPrice || 0) * (item.count || 1),
                0,
              );

        const { data } = await addMutation({
          variables: { ...variables, totalAmount: calculatedTotal },
        });
        const order = (data as any)?.cpOrdersAdd;

        if (order?._id) {
          setActiveOrder({ ...order, totalAmount: calculatedTotal });
          setCartItems([]);
        }

        return {
          success: !!order?._id,
          order: { ...order, totalAmount: calculatedTotal },
        };
      } finally {
        setOrderLoading(false);
      }
    },
    [addMutation, setActiveOrder, setCartItems, setOrderLoading],
  );

  const removeOrder = useCallback(
    async (orderId: string) => {
      const { data } = await removeMutation({ variables: { _id: orderId } });
      return { success: !!(data as any)?.ordersRemove };
    },
    [removeMutation],
  );

  return { createOrder, removeOrder, loading: addLoading || removeLoading };
}
```

---

## `hooks/payment.ts`

```typescript
import { useMutation, useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { PAYMENTS } from "@/graphql/ecommerce/queries/payment";
import {
  CREATE_INVOICE,
  CHECK_INVOICE,
  PAYMENT_TRANSACTIONS_ADD,
} from "@/graphql/ecommerce/mutations/payment";
import {
  paymentsAtom,
  selectedPaymentAtom,
  invoiceAtom,
} from "@/store/payment.store";

export function usePayments() {
  const { data, loading, error } = useQuery(PAYMENTS, {
    variables: { status: "active" },
    fetchPolicy: "cache-and-network",
  });

  return {
    payments: (data as any)?.cpPayments || [],
    loading,
    error,
  };
}

export function useCreateInvoice() {
  const [createMutation, { loading, error }] = useMutation(CREATE_INVOICE);
  const [, setInvoice] = useAtom(invoiceAtom);

  const createInvoice = useCallback(
    async (params: {
      paymentIds: string[];
      amount: number;
      description?: string;
      contentType?: string;
      contentTypeId?: string;
      customerId?: string;
      customerType?: string;
    }) => {
      const { data } = await createMutation({
        variables: {
          input: {
            amount: params.amount,
            paymentIds: params.paymentIds,
            description: params.description || "",
            contentType: params.contentType || "pos:orders",
            contentTypeId: params.contentTypeId,
            customerId: params.customerId || "empty",
            customerType: params.customerType || "visitor",
            data: {},
          },
        },
      });

      const invoice = (data as any)?.invoiceCreate;
      if (invoice) setInvoice(invoice);
      return { success: !!invoice, invoice };
    },
    [createMutation, setInvoice],
  );

  return { createInvoice, loading, error };
}

export function useCheckInvoice() {
  const [checkMutation, { loading, error }] = useMutation(CHECK_INVOICE);

  const checkInvoice = useCallback(
    async (invoiceId: string) => {
      const { data } = await checkMutation({ variables: { id: invoiceId } });
      return (data as any)?.invoicesCheck ?? null;
    },
    [checkMutation],
  );

  return { loading, error, checkInvoice };
}

export function useAddPaymentTransaction() {
  const [addMutation, { loading, error }] = useMutation(
    PAYMENT_TRANSACTIONS_ADD,
  );

  const addTransaction = useCallback(
    async (params: {
      invoiceId: string;
      paymentId: string;
      paymentKind?: string;
      amount?: number;
      details?: Record<string, unknown>;
    }) => {
      const { data } = await addMutation({
        variables: {
          input: {
            invoiceId: params.invoiceId,
            paymentId: params.paymentId,
            paymentKind: params.paymentKind,
            amount: params.amount,
            details: params.details,
          },
        },
      });

      const transaction = (data as any)?.paymentTransactionsAdd;
      return { success: !!transaction, transaction };
    },
    [addMutation],
  );

  return { addTransaction, loading, error };
}
```

---

## `features/products/hooks/useProductFilters.ts`

```typescript
import { atom, useAtom } from "jotai";
import { useQuery } from "@apollo/client/react";
import { POSC_PRODUCT_CATEGORIES } from "../graphql/queries";
import { ICategory } from "../types";

// undefined = "Бүгд" (бүх category)
export const activeCategoryIdAtom = atom<string | undefined>(undefined);

export function useProductCategories() {
  const [activeCategoryId, setActiveCategoryId] = useAtom(activeCategoryIdAtom);

  const { data, loading } = useQuery<{ poscProductCategories: ICategory[] }>(
    POSC_PRODUCT_CATEGORIES,
    {
      variables: { excludeEmpty: true },
      fetchPolicy: "cache-and-network",
    },
  );

  return {
    categories: data?.poscProductCategories ?? [],
    categoriesLoading: loading,
    activeCategoryId,
    setActiveCategoryId,
  };
}

import { useAtomValue } from "jotai";
import { useQuery } from "@apollo/client/react";
import { POSC_PRODUCTS } from "../graphql/queries";
import { Product } from "../types";
import { activeCategoryIdAtom } from "./useProductFilters";

export function useProducts(perPage = 20, page = 1) {
  const activeCategoryId = useAtomValue(activeCategoryIdAtom);

  const { data, loading, fetchMore } = useQuery<{ cpPoscProducts: Product[] }>(
    POSC_PRODUCTS,
    {
      variables: { categoryId: activeCategoryId, perPage, page },
      fetchPolicy: "cache-and-network",
    },
  );

  return {
    products: data?.cpPoscProducts ?? [],
    loading,
    fetchMore,
    activeCategoryId,
  };
}

import { useQuery } from "@apollo/client/react";
import { POSC_PRODUCT_DETAIL } from "../graphql/queries";
import { Product } from "../types";

export function useProductDetail(productId: string) {
  const { data, loading, error } = useQuery<{ poscProductDetail: Product }>(
    POSC_PRODUCT_DETAIL,
    {
      variables: { _id: productId },
      skip: !productId,
      fetchPolicy: "cache-and-network",
    },
  );

  return {
    product: data?.poscProductDetail ?? null,
    loading,
    error,
  };
}

export function useFilteredProducts(categoryId?: string, perPage = 20) {
  const { data, loading, error, fetchMore } = useQuery<{
    cpPoscProducts: IProduct[];
  }>(PRODUCTS, {
    variables: { categoryId, perPage },
    fetchPolicy: "cache-and-network",
  });

  return {
    products: data?.cpPoscProducts ?? [],
    loading,
    fetchMore,
    activeCategoryId,
  };
}

// No single-page-by-slug query — fetch all pages, filter client-side
export function useCmsPageDetail(slug: string) {
  const { data, loading, error } = useQuery(CP_PAGES, {
    variables: {},
    skip: !slug,
    fetchPolicy: "cache-and-network",
  });

  const pages: any[] = (data as any)?.cpPages || [];
  return {
    page: pages.find((p) => p.slug === slug) || null,
    loading,
    error,
  };
}

export function useCmsPosts(variables?: {
  categoryIds?: string[];
  tagIds?: string[];
  searchValue?: string;
  cursor?: string;
  limit?: number;
}) {
  const { data, loading, error } = useQuery(CP_POSTS, {
    variables: { status: "published", ...variables },
    fetchPolicy: "cache-and-network",
  });

  return {
    posts: (data as any)?.cpPosts || [],
    loading,
    error,
  };
}

export function useCmsPostDetail(slug: string) {
  const { data, loading, error } = useQuery(CP_POST, {
    variables: { slug },
    skip: !slug,
    fetchPolicy: "cache-and-network",
  });

  return {
    post: (data as any)?.cpPost || null,
    loading,
    error,
  };
}
```
