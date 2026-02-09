import { gql } from '@apollo/client';

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    users {
      id
      username
      email
      fullName
    }
    products {
      id
      name
      price
      category
    }
    orders {
      id
      userId
      status
      totalAmount
      createdAt
    }
  }
`;
