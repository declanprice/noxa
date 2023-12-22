import { gql } from 'apollo-angular';

export const GET_USER = gql`
    query GetUser($userId: String!) {
        getUser(id: $userId) {
            id
            emails
        }
    }
`;
