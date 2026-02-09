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
