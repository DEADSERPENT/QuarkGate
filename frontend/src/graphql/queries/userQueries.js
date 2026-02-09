import { gql } from '@apollo/client';

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      username
      email
      fullName
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: BigInteger!) {
    user(id: $id) {
      id
      username
      email
      fullName
      orders {
        id
        status
        totalAmount
        createdAt
      }
    }
  }
`;
