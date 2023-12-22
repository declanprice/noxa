import { gql } from 'apollo-angular';

export const GET_USER = gql`
    query GetUser($userId: String!) {
        user(id: $userId) {
            id
            emails
        }
    }
`;
