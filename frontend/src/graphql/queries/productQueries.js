import { gql } from '@apollo/client';

export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    products {
      id
      name
      description
      price
      stockQuantity
      category
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: BigInteger!) {
    product(id: $id) {
      id
      name
      description
      price
      stockQuantity
      category
    }
  }
`;
