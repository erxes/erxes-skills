# Ecommerce SDK Hooks

## `src/hooks/auth.ts`

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { useCallback } from "react";
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
    triggerRefetchUser: () => refetch(), // directly refetch — do NOT use setTrigger(true)
  };
}

export function useLogin() {
  const [loginMutation, { loading, error }] = useMutation(LOGIN);
  const { triggerRefetchUser } = useCurrentUser();

  const login = useCallback(
    async (input: ILoginInput) => {
      const { data } = await loginMutation({
        variables: { email: input.email, password: input.password },
      });

      // clientPortalUserLoginWithCredentials returns JSON scalar { token, refreshToken }
      const raw = (data as any)?.clientPortalUserLoginWithCredentials;
      const token = raw?.token;
      const refreshToken = raw?.refreshToken;

      if (token) {
        // ЧУХАЛ: token-г sessionStorage-д хадгалсны ДАРАА refetch дуудна
        sessionStorage.setItem("token", token);
        if (refreshToken) sessionStorage.setItem("refreshToken", refreshToken);
        triggerRefetchUser();

        const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
        if (redirectAfterLogin) {
          sessionStorage.removeItem("redirectAfterLogin");
          window.location.href = redirectAfterLogin;
          return { success: true, token, redirect: redirectAfterLogin };
        }
        window.location.href = "/";
        return { success: true, token };
      }

      return { success: !!token, token };
    },
    [loginMutation, triggerRefetchUser],
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

      // clientPortalUserRegister returns user object — no token
      const user = (data as any)?.clientPortalUserRegister;
      return { success: !!user?._id, user };
    },
    [registerMutation],
  );

  return { register, loading, error };
}

export function useLogout() {
  const [, setCurrentUser] = useAtom(currentUserAtom);

  const logout = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    setCurrentUser(null);
    window.location.href = "/";
  }, [setCurrentUser]);

  return { logout };
}

export function useForgotPassword() {
  const [mutation, { loading, error }] = useMutation(FORGOT_PASSWORD);

  const forgotPassword = useCallback(
    async (input: IForgotPasswordInput) => {
      const { data } = await mutation({
        variables: {
          email: input.email,
          clientPortalId: process.env.NEXT_PUBLIC_ERXES_CP_TOKEN,
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

## `src/hooks/order.ts`

```typescript
"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { ORDERS_ADD, ORDERS_REMOVE } from "@/graphql/ecommerce/mutations/order";
import { ORDERS, ORDER_DETAIL } from "@/graphql/ecommerce/queries/order";
import { activeOrderAtom, orderLoadingAtom } from "@/store/order.store";
import { cartItemsAtom } from "@/store/cart.store";
import { IOrder } from "@/types/order.types";

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
      type: string; // "delivery" | "pickup" | "eat" — ЗААВАЛ шаардлагатай
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

## `src/hooks/payment.ts`

```typescript
"use client";

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

// invoicesCheck — useMutation (Query биш!), parameter нэр: `id`
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

## `src/hooks/queries.ts`

```typescript
"use client";

import { useQuery } from "@apollo/client";
import {
  POSC_PRODUCTS as PRODUCTS,
  POSC_PRODUCT_DETAIL as PRODUCT_DETAIL,
  POSC_PRODUCT_CATEGORIES as PRODUCT_CATEGORIES,
} from "@/graphql/ecommerce/queries/product";
import { CP_PAGES } from "@/graphql/cms/queries/page";
import { CP_POST, CP_POSTS } from "@/graphql/cms/queries/post";

export function useProducts(variables?: {
  categoryId?: string;
  page?: number;
  perPage?: number;
  searchValue?: string;
}) {
  const { data, loading, error, fetchMore } = useQuery(PRODUCTS, {
    variables: { page: 1, perPage: 20, ...variables },
    fetchPolicy: "cache-and-network",
  });

  return {
    products: (data as any)?.poscProducts || [],
    loading,
    error,
    fetchMore,
  };
}

export function useProductDetail(productId: string) {
  const { data, loading, error } = useQuery(PRODUCT_DETAIL, {
    variables: { _id: productId },
    skip: !productId,
    fetchPolicy: "cache-and-network",
  });

  return {
    product: (data as any)?.poscProductDetail || null,
    loading,
    error,
  };
}

export function useProductCategories(parentId?: string) {
  const { data, loading, error } = useQuery(PRODUCT_CATEGORIES, {
    variables: { parentId },
    fetchPolicy: "cache-and-network",
  });

  return {
    categories: (data as any)?.poscProductCategories || [],
    loading,
    error,
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

// CP_POST accepts { slug } directly
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
