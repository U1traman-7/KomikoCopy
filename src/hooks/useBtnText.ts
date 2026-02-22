import { useAtom } from "jotai";
import { authAtom } from "state";

export const useBtnText = (noLoginText: string, loginText: string) => {
  const [isAuth] = useAtom(authAtom);
  return isAuth ? loginText : noLoginText;
};
