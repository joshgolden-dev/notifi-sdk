import axios from 'axios';
import { useCallback } from 'react';
import useNotifiConfig, { BlockchainEnvironment } from './useNotifiConfig';
import useNotifiJwt from './useNotifiJwt';

export type Payload = Readonly<{
  walletPublicKey: string;
  daoAddress: string;
  timestamp: number;
  signature: string;
}>;

export type Result = Readonly<{
  email: string | null;
  emailConfirmed: boolean;
  token: string | null;
}>;

type PostResponse = Readonly<{
  data?: Readonly<{
    logInFromDao?: Result | null;
  }>;
}>;

const MUTATION_STRING = `mutation logInFromDao(
  $walletPublicKey: String!
  $daoAddress: String!
  $timestamp: Long!
  $signature: String!
) {
  logInFromDao(daoLogInInput: {
    walletPublicKey: $walletPublicKey
    daoAddress: $daoAddress
    timestamp: $timestamp
  }, signature: $signature) {
    email
    emailConfirmed
    token
  }
}`;

const useLogInFromDao = (
  env = BlockchainEnvironment.MainNetBeta
): ((payload: Payload) => Promise<Result>) => {
  const { setJwt } = useNotifiJwt();
  const { gqlUrl } = useNotifiConfig(env);

  const logInFromDao = useCallback(
    async (payload: Payload) => {
      const { walletPublicKey, daoAddress, timestamp, signature } = payload;

      const resp = await axios.post<PostResponse>(gqlUrl, {
        query: MUTATION_STRING,
        variables: {
          walletPublicKey,
          daoAddress,
          timestamp,
          signature
        }
      });
      const result = resp.data.data?.logInFromDao;
      if (result == null) {
        throw new Error('No data returned from notifi');
      }

      setJwt(result.token);

      return result;
    },
    [setJwt]
  );

  return logInFromDao;
};

export default useLogInFromDao;
