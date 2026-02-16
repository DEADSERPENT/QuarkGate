import { gql } from '@apollo/client';

export const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    orders {
      id
      userId
      status
      totalAmount
      createdAt
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($userId: BigInteger!, $totalAmount: BigDecimal!, $productIds: [BigInteger!]!) {
    createOrder(userId: $userId, totalAmount: $totalAmount, productIds: $productIds) {
      id
      userId
      status
      totalAmount
      createdAt
    }
  }
`;

export const ORDER_CREATED_SUBSCRIPTION = gql`
  subscription OnOrderCreated {
    orderCreated {
      id
      userId
      status
      totalAmount
      createdAt
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: BigInteger!) {
    order(id: $id) {
      id
      userId
      status
      totalAmount
      createdAt
      products {
        id
        name
        price
        category
      }
      payment {
        id
        amount
        method
        status
        processedAt
      }
    }
  }
`;
